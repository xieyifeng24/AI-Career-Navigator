import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import AsyncMock, patch
import os

from fastapi.testclient import TestClient
from src.career.api import app
from src.career.regional import DATA, current, dosm_rows, world_bank_rows, refresh
from src.career.regional_ai import RegionalRequest, canonical_answers
from src.career.regional_ai import explain, InferenceError

ROOT=Path(__file__).resolve().parents[1]
BANK=json.loads((ROOT/'prototype/v3/bank.json').read_text())
ANSWERS={q['id']:5 for q in BANK['questions'] if q['trackId'] in {'GENERAL','SW'}}


class RegionalPilot(unittest.TestCase):
    def test_snapshot_real_sources_and_granularity(self):
        snapshot=current()
        self.assertEqual({r['role_id'] for r in snapshot['mappings']},{'software','ai-research'})
        self.assertIsNone(next(r for r in snapshot['mappings'] if r['role_id']=='ai-research')['onet_soc_code'])
        rows=snapshot['facts']
        self.assertIn('DOSM / OpenDOSM',{r['source_name'] for r in rows})
        self.assertIn('O*NET Database',{r['source_name'] for r in rows})
        self.assertIn('ESCO',{r['source_name'] for r in rows})
        self.assertEqual(next(r for r in rows if r['metric']=='median_monthly_wages_professionals')['role_id'],None)
        self.assertFalse(any(r['role_id']=='ai-research' and r['metric']=='median_annual_wage' for r in rows))

    def test_unavailable_source_retains_valid_previous(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory=Path(tmp)
            (directory/'current.json').write_text((DATA/'current.json').read_text())
            (directory/'state.json').write_text((DATA/'state.json').read_text())
            class Failed:
                def get(self,url): raise __import__('httpx').ConnectError('unavailable')
            result=refresh(directory=directory,client=Failed(),force=True)
            self.assertEqual(result['sources']['dosm']['status'],'cached-after-error')
            self.assertIsNotNone(result['sources']['dosm']['last_success'])
            self.assertTrue(any(x['source_name']=='DOSM / OpenDOSM' for x in current(directory)['facts']))

    def test_canonical_answers_reject_legacy_or_partial(self):
        req=RegionalRequest(answers=ANSWERS,deterministic_profile=['Fictional profile summary'])
        self.assertEqual(len(canonical_answers(req,BANK)),12)
        with self.assertRaises(ValueError): canonical_answers(req.model_copy(update={'answers':{'SW01':'A'}}),BANK)

    def test_http_base_survives_ai_unconfigured_and_source_routes(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'RUNPOD_API_KEY':'','RUNPOD_ENDPOINT_ID':'','LIMIT_STATE_DIR':tmp,'SESSION_SECRET':'regional-test-only'}):
            with TestClient(app) as client:
                self.assertEqual(client.get('/api/regional/current').status_code,200)
                self.assertEqual(client.get('/data/regional/current.json').status_code,200)
                self.assertEqual(client.get('/combined/regional-view.js').status_code,200)
                self.assertEqual(client.get('/combined/sw-analysis.js').status_code,200)
                session=client.get('/api/session')
                response=client.post('/api/regional/explain',json={'track_id':'SW','language':'en','region':'MY','answers':ANSWERS,
                    'deterministic_profile':['Fictional profile summary']},headers={'Origin':'http://testserver','X-CSRF-Token':session.json()['csrf_token']})
                self.assertEqual(response.status_code,503)
                self.assertEqual(client.get('/api/regional/current').status_code,200)

    def test_optional_ai_validates_citations_and_uses_cache(self):
        request=RegionalRequest(answers=ANSWERS,deterministic_profile=['Fictional profile summary'])
        class Response:
            content=b'{}'
            def raise_for_status(self): pass
            def json(self):
                return {'choices':[{'finish_reason':'stop','message':{'content':json.dumps({
                    name:{'text':'A concise fictional career exploration point supported by the supplied facts.',
                          'source_ids':['S1'] if name=='market_context' else []}
                    for name in ['overview','route_tradeoff','market_context','next_step']})}}]}
        class Provider:
            configured=True
            key='test-private-key'
            endpoint='test-endpoint'
            model='test-model'
            client=type('Client',(),{'post':AsyncMock(return_value=Response())})()
        provider=Provider()
        async def run():
            cache={}
            first=await explain(provider,request,'session-A',BANK,cache,current())
            second=await explain(provider,request,'session-A',BANK,cache,current())
            self.assertEqual(first['mode'],'real-ai')
            self.assertTrue(second['cached'])
            self.assertEqual(provider.client.post.await_count,1)
            self.assertNotIn(provider.key,json.dumps(first))
        __import__('asyncio').run(run())

    def test_optional_ai_rejects_invented_quantities(self):
        request=RegionalRequest(answers=ANSWERS,deterministic_profile=['Fictional profile summary'])
        content={name:{'text':'A sourced exploration note with an invented 98% hiring probability.',
                       'source_ids':['S1'] if name=='market_context' else []}
                 for name in ['overview','route_tradeoff','market_context','next_step']}
        response=type('Response',(),{'content':b'{}','raise_for_status':lambda self:None,
            'json':lambda self:{'choices':[{'finish_reason':'stop','message':{'content':json.dumps(content)}}]}})()
        provider=type('Provider',(),{'configured':True,'key':'private','endpoint':'test-endpoint','model':'test-model',
            'client':type('Client',(),{'post':AsyncMock(return_value=response)})()})()
        async def run():
            with self.assertRaises(InferenceError):
                await explain(provider,request,'session-B',BANK,{},current())
        __import__('asyncio').run(run())

    def test_http_ai_route_reaches_provider_without_changing_base(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'RUNPOD_API_KEY':'','RUNPOD_ENDPOINT_ID':'','LIMIT_STATE_DIR':tmp,'SESSION_SECRET':'regional-http-test'}):
            with TestClient(app) as client:
                app.state.inference.key='fixture-private-key'
                app.state.inference.endpoint='fixture-endpoint'
                token=client.get('/api/session').json()['csrf_token']
                payload={'track_id':'SW','language':'en','region':'US','answers':ANSWERS,
                         'deterministic_profile':['Fictional profile summary']}
                fixture={'mode':'real-ai','sections':{'overview':{'text':'Fixture explanation','source_ids':[]}},'sources':{},'cached':False}
                with patch('src.career.api.explain_regional',new=AsyncMock(return_value=fixture)) as called:
                    response=client.post('/api/regional/explain',json=payload,headers={'Origin':'http://testserver','X-CSRF-Token':token})
                    self.assertEqual(response.status_code,200)
                    self.assertEqual(called.await_args.args[1].region,'US')
                    self.assertEqual(called.await_args.args[1].answers,ANSWERS)
                self.assertFalse(app.state.busy)
                self.assertEqual(client.get('/api/regional/current').status_code,200)


if __name__=='__main__': unittest.main()
