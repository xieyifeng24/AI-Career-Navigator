import asyncio
import copy
import json
import os
import unittest
import tempfile
from unittest.mock import patch, AsyncMock
import httpx
from fastapi.testclient import TestClient
from pydantic import ValidationError
from src.career.api import app
from src.career.inference import RunPod, InferenceError, make_messages, validate_analysis, output_schema, normalize_generation
from src.career.matching import rank_roles
from src.career.models import Profile
from src.career.sources import parse_role, parse_research, SourceUnavailable, SourceStore
from career_fixtures import profile, snapshot, analysis

class Contracts(unittest.TestCase):
    def test_input_requires_synthetic_no_contacts_and_valid_budget(self):
        for changes in [{'synthetic':False},{'hours':0},{'hours':float('nan')},{'skills':''},{'background':'me@example.com'},{'background':'x'*181}]:
            with self.subTest(changes=changes),self.assertRaises(ValidationError): profile(**changes)

    def test_occupation_and_skill_changes_affect_matching_and_prompts(self):
        first=profile(); second=profile(background='Project coordinator',skills='Coordination, Time Management',tasks='Coordinate project schedules; plan project resources.',goal='Project delivery')
        s=snapshot(); a=rank_roles(first,s['roles']);b=rank_roles(second,s['roles'])
        self.assertEqual(a[0]['id'],'marketing');self.assertEqual(b[0]['id'],'project')
        self.assertNotEqual(a[0]['matched_skills'],b[0]['matched_skills'])
        changed=rank_roles(profile(skills='Coordination'),s['roles'])
        self.assertNotEqual(next(r for r in changed if r['id']=='marketing')['gaps'],a[0]['gaps'])
        self.assertIn(second.tasks,make_messages(second,s,b)[1]['content'])
        self.assertNotEqual(make_messages(first,s,a),make_messages(second,s,b))

    def test_trend_update_changes_ranking_score(self):
        s=snapshot();before=rank_roles(profile(),s['roles'])[0]['score']
        s['roles'][0]['growth']='Decline';after=rank_roles(profile(),s['roles'])[0]['score']
        self.assertLess(after,before)

    def test_valid_schema_and_hour_budget(self):
        for hours in [1,3,8]:
            p=profile(hours=hours);r=validate_analysis(analysis(p),p,snapshot())
            self.assertLessEqual(sum(w.hours for w in r.paths[0].weeks),4*hours)
        with self.assertRaises(ValueError):validate_analysis(analysis(profile(hours=8)),profile(hours=1),snapshot())
        self.assertIn('"hours": 1.0',make_messages(profile(hours=1),snapshot(),[])[1]['content'])

    def test_generation_schema_separates_input_quotes_from_database_tasks(self):
        p=profile();schema=output_schema(p,snapshot());s=schema['$defs']
        self.assertTrue(all(q in p.tasks for q in s['TaskAssessment']['properties']['input_quote']['enum']))
        for variant in schema['properties']['capabilities']['properties'].values():
            self.assertTrue(all(any(q in text for text in [p.tasks,p.skills,p.aiUse]) for q in variant['properties']['evidence_quote']['enum']))
        self.assertEqual(s['Path']['properties']['role_id']['enum'],['marketing','project'])

    def test_keyed_generation_preserves_all_required_sections(self):
        raw=analysis()
        for field,key in [('capabilities','lens'),('paths','kind'),('scenarios','pace')]:
            raw[field]={item[key]:item for item in reversed(raw[field])}
        normalized=normalize_generation(raw)
        result=validate_analysis(normalized,profile(),snapshot())
        self.assertEqual([c.lens for c in result.capabilities],['independent','collaboration','extended'])
        del raw['capabilities'][1]
        with self.assertRaises(ValueError):validate_analysis(raw,profile(),snapshot())

    def test_rejects_invalid_model_output(self):
        mutations=[lambda a:a['summary'].update(source_ids=['invented']),lambda a:a['tasks'][0].update(input_quote='Invented task'),
          lambda a:a['capabilities'][0].update(evidence_quote='Invented evidence'),lambda a:a['paths'][0].update(role_id='Imaginary job'),
          lambda a:a['paths'][0]['weeks'][0].update(resource_id='fake-course'),lambda a:a['paths'][0]['weeks'][0].update(hours=99),
          lambda a:a['summary'].update(text='Replacement probability 95%'),lambda a:a['summary'].update(text='Click https://bad.example'),
          lambda a:a['paths'][0]['gaps'][0].update(skill='Imaginary skill'),lambda a:a['scenarios'][0].update(pace='fast')]
        for mutation in mutations:
            a=analysis();mutation(a)
            with self.subTest(mutation=mutation),self.assertRaises(ValueError): validate_analysis(a,profile(),snapshot())

    def test_source_parser_fails_closed(self):
        with self.assertRaises(SourceUnavailable): parse_role('<h1>Not a role</h1>','example')
        with self.assertRaises(SourceUnavailable): parse_research('<rss><channel/></rss>')

    def test_source_parser_extracts_dates_and_ignores_untrusted_links(self):
        html='<h1><span class="main">Test occupation</span> Updated 2026</h1><div id="EssentialSkills"><li><b>Writing</b></li></div><div id="Tasks"><li><div class="order-2">Write reports</div></li></div><div id="WagesEmployment">Projected growth (2025-2035) Decline (-1% or lower) Projected job openings 100</div>'
        role=parse_role(html,'test');self.assertEqual(role['skills'],['Writing']);self.assertEqual(role['period'],'2025-2035')
        xml='<rss><channel><item><title>Test research</title><link>https://arxiv.org/abs/2601.00001</link><pubDate>Wed, 21 Oct 2026 00:00:00 -0400</pubDate><description>Test abstract</description></item><item><link>https://untrusted.example/</link></item></channel></rss>'
        research=parse_research(xml);self.assertEqual(len(research),1);self.assertEqual(research[0]['date'],'2026-10-21')

class Provider(unittest.IsolatedAsyncioTestCase):
    async def test_real_http_contract_without_real_inference(self):
        seen=[]
        def handler(request):
            seen.append(request)
            return httpx.Response(200,json={'id':'TEST-FIXTURE-NOT-LIVE','choices':[{'finish_reason':'stop','message':{'content':json.dumps(analysis())}}]})
        with patch.dict(os.environ,{'RUNPOD_API_KEY':'test-only','RUNPOD_ENDPOINT_ID':'test-endpoint'}):
            async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
                result,meta=await RunPod(client).analyze(profile(),snapshot(),[])
        self.assertEqual(meta['request_id'],'TEST-FIXTURE-NOT-LIVE')
        self.assertEqual(seen[0].url.host,'api.runpod.ai')
        payload=json.loads(seen[0].content)
        self.assertEqual(payload['response_format']['type'],'json_schema')
        self.assertIn(profile().tasks,payload['messages'][1]['content'])

    async def test_upstream_errors_have_no_mock_fallback(self):
        for response in [httpx.Response(503,text='SECRET_INTERNAL_ERROR'),httpx.Response(200,json={'choices':[]}),httpx.Response(200,json={'choices':[{'finish_reason':'length'}]})]:
            with patch.dict(os.environ,{'RUNPOD_API_KEY':'test-only','RUNPOD_ENDPOINT_ID':'test-endpoint'}):
                async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:response)) as client:
                    with self.assertRaises(InferenceError) as ctx:await RunPod(client).analyze(profile(),snapshot(),[])
                    self.assertNotIn('SECRET_INTERNAL_ERROR',str(ctx.exception))

    async def test_timeout(self):
        def fail(request): raise httpx.ReadTimeout('timeout')
        with patch.dict(os.environ,{'RUNPOD_API_KEY':'test-only','RUNPOD_ENDPOINT_ID':'test-endpoint'}):
            async with httpx.AsyncClient(transport=httpx.MockTransport(fail)) as client:
                with self.assertRaises(InferenceError):await RunPod(client).analyze(profile(),snapshot(),[])

    async def test_source_outage_is_not_replaced_by_hardcoded_lists(self):
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(503))) as client:
            with self.assertRaises(SourceUnavailable): await SourceStore(client).get()

class API(unittest.TestCase):
    def setUp(self):
        self.runtime=tempfile.TemporaryDirectory()
        self.env=patch.dict(os.environ,{'RUNPOD_API_KEY':'','RUNPOD_ENDPOINT_ID':'','SESSION_SECRET':'test-session-secret-not-production','LIMIT_STATE_DIR':self.runtime.name});self.env.start()
        self.client=TestClient(app);self.client.__enter__()
    def tearDown(self): self.client.__exit__(None,None,None);self.env.stop();self.runtime.cleanup()
    def test_no_configuration_returns_503_not_demo(self):
        self.assertFalse(self.client.get('/api/health').json()['inference_configured'])
        r=self.client.post('/api/analyze',json=profile().model_dump(),headers=self.auth());self.assertEqual(r.status_code,503);self.assertNotIn('analysis',r.json())
    def test_validation_does_not_echo_personal_details(self):
        r=self.client.post('/api/analyze',json={'background':'private@example.com'})
        self.assertEqual(r.status_code,422);self.assertNotIn('private@example.com',r.text)
    def test_files_and_body_are_bounded(self):
        for path in ['/.env','/requirements.txt','/server.py','/logic.test.mjs']:self.assertEqual(self.client.get(path).status_code,404)
        self.assertEqual(self.client.post('/api/analyze',content='x'*19000).status_code,413)
        self.assertIn("script-src 'self'",self.client.get('/').headers['Content-Security-Policy'])
    def auth(self,client=None):
        client=client or self.client
        session=client.get('/api/session')
        self.assertIn('HttpOnly',session.headers['set-cookie'])
        self.assertIn('SameSite=strict',session.headers['set-cookie'])
        return {'Origin':'http://testserver','X-CSRF-Token':session.json()['csrf_token']}

    def test_session_and_csrf_block_paid_requests(self):
        app.state.inference.key='test';app.state.inference.endpoint='test-id'
        self.assertEqual(self.client.post('/api/analyze',json=profile().model_dump()).status_code,403)
        headers=self.auth()
        for changed in [headers|{'Origin':'https://attacker.example'},headers|{'X-CSRF-Token':'wrong'}]:
            self.assertEqual(self.client.post('/api/analyses',json=profile().model_dump(),headers=changed).status_code,403)
        self.assertEqual(self.client.post('/api/analyses',json=profile(synthetic=True).model_dump()|{'synthetic':False},headers=headers).status_code,422)

    def test_source_matching_is_explicitly_non_ai(self):
        with patch.object(self.client.app.state.sources,'get',new=AsyncMock(return_value=snapshot())):
            r=self.client.post('/api/match',json=profile().model_dump())
        self.assertEqual(r.status_code,200);self.assertEqual(r.json()['mode'],'source-matching')
        self.assertNotIn('analysis',r.json());self.assertEqual(r.json()['ranking'][0]['id'],'marketing')

    def test_background_analysis_is_gated_and_pollable(self):
        from src.career.models import Analysis
        with patch.dict(os.environ,{'DEMO_ACCESS_CODE':'test-code'}):
            app.state.inference.key='test';app.state.inference.endpoint='test-id'
            self.assertEqual(self.client.post('/api/analyses',json=profile().model_dump()).status_code,403)
            with patch.object(app.state.sources,'get',new=AsyncMock(return_value=snapshot())),patch.object(app.state.inference,'analyze',new=AsyncMock(return_value=(Analysis.model_validate(analysis()),{'request_id':'TEST-FIXTURE-NOT-LIVE','model':'FIXTURE'}))):
                response=self.client.post('/api/analyses',json=profile().model_dump(),headers=self.auth())
                self.assertEqual(response.status_code,202)
                url='/api/analyses/'+response.json()['job_id']
                self.assertEqual(self.client.get(url).status_code,200)
                other=TestClient(app)
                other.get('/api/session')
                self.assertEqual(other.get(url).status_code,404)
                other.close()
                result=self.client.get(url,headers=self.auth()).json()
                self.assertEqual(result['status'],'complete')
                self.assertEqual(result['result']['mode'],'real-ai')

    def test_successful_analysis_http_contract_is_fixture_not_live_evidence(self):
        from src.career.models import Analysis
        with patch.dict(os.environ,{'DEMO_ACCESS_CODE':'test-code'}):
            self.client.app.state.inference.key='test';self.client.app.state.inference.endpoint='test-id'
            with patch.object(self.client.app.state.sources,'get',new=AsyncMock(return_value=snapshot())),patch.object(self.client.app.state.inference,'analyze',new=AsyncMock(return_value=(Analysis.model_validate(analysis()),{'request_id':'TEST-FIXTURE-NOT-LIVE','model':'FIXTURE'}))):
                r=self.client.post('/api/analyze',json=profile().model_dump(),headers=self.auth())
            self.assertEqual(r.status_code,200);self.assertEqual(r.json()['inference']['request_id'],'TEST-FIXTURE-NOT-LIVE')
            self.assertNotIn('test-code',r.text);self.assertFalse(self.client.app.state.busy)
