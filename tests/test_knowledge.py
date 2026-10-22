import asyncio
import copy
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import tempfile
import unittest
import httpx
from pydantic import ValidationError
from src.career.knowledge.schema import Snapshot, Occupation
from src.career.knowledge.sync import synchronize, due, lock, ROOT
from src.career.knowledge import adapters
from src.career.knowledge.runtime import KnowledgeStore

NOW=datetime(2026,10,22,tzinfo=timezone.utc)
class KnowledgeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.directory=Path(self.temp.name)/'data';self.cache=Path(self.temp.name)/'cache'
        self.snapshot=Snapshot.model_validate_json((ROOT/'data/knowledge/current.json').read_text())
    def providers(self,changed=False):
        def source(name):
            data=[r.model_copy(deep=True) for r in self.snapshot.records if r.source==name]
            if changed and data:data[0].description+=' Updated official fixture description.'
            return data
        def manual():raise adapters.ManualImportRequired('No approved import')
        return {'onet':lambda:source('onet'),'esco':lambda:source('esco'),'myfuturejobs':manual}
    def test_actual_seed_has_two_real_sources_and_no_invented_malaysian_market(self):
        self.assertEqual(len(self.snapshot.records),10)
        for record in self.snapshot.records:
            self.assertTrue(record.skills);self.assertEqual(record.geography,{'onet':'US','esco':'EU'}[record.source])
            self.assertFalse(record.trends);self.assertIsNone(record.published_at)
        self.assertTrue(all(len(refs)==2 for refs in self.snapshot.links.values()))
    def test_exact_fourteen_days_crosses_month_year_and_leap_day(self):
        for start in [NOW,datetime(2026,12,28,tzinfo=timezone.utc),datetime(2028,2,22,tzinfo=timezone.utc)]:
            state={'last_attempt':start.isoformat()}
            self.assertFalse(due(state,start+timedelta(days=14)-timedelta(seconds=1)))
            self.assertTrue(due(state,start+timedelta(days=14)))
    def test_publish_changed_data_and_skip_before_due(self):
        s=synchronize(self.directory,self.cache,NOW,providers=self.providers())
        self.assertEqual(s['sources']['myfuturejobs']['status'],'manual_import_required')
        self.assertEqual(synchronize(self.directory,self.cache,NOW+timedelta(days=13),providers={}),{'result':'not_due','next_due':s['next_due']})
        old=(self.directory/'current.json').read_bytes()
        s2=synchronize(self.directory,self.cache,NOW+timedelta(days=14),providers=self.providers(True))
        self.assertNotEqual(s['version'],s2['version']);self.assertNotEqual(old,(self.directory/'current.json').read_bytes())
        self.assertEqual(len(list((self.directory/'versions').glob('*.json'))),2)
    def test_all_sources_offline_preserve_byte_exact_current_and_log_errors(self):
        synchronize(self.directory,self.cache,NOW,providers=self.providers());before=(self.directory/'current.json').read_bytes()
        def bad():raise OSError('Official channel unavailable')
        result=synchronize(self.directory,self.cache,NOW+timedelta(days=14),providers=dict.fromkeys(['onet','esco','myfuturejobs'],bad))
        self.assertEqual((self.directory/'current.json').read_bytes(),before)
        self.assertEqual(result['sources']['onet']['status'],'error')
        self.assertIn('Official channel unavailable',result['sources']['esco']['error'])
    def test_partial_source_failure_retains_every_previous_record_of_that_source(self):
        synchronize(self.directory,self.cache,NOW,providers=self.providers());old=Snapshot.model_validate_json((self.directory/'current.json').read_text())
        providers=self.providers(True);providers['onet']=lambda:[]
        synchronize(self.directory,self.cache,NOW+timedelta(days=14),providers=providers)
        new=Snapshot.model_validate_json((self.directory/'current.json').read_text())
        self.assertEqual([r for r in old.records if r.source=='onet'],[r for r in new.records if r.source=='onet'])
    def test_overlapping_sync_is_rejected(self):
        with lock(self.directory/'.sync.lock'):
            with self.assertRaisesRegex(RuntimeError,'already running'):synchronize(self.directory,self.cache,NOW,providers=self.providers())
    def test_invalid_region_duplicate_or_dangling_link_rejected(self):
        payload=self.snapshot.model_dump(mode='json');payload['records'][0]['geography']='MY'
        with self.assertRaises(ValidationError):Snapshot.model_validate(payload)
        payload=self.snapshot.model_dump(mode='json');payload['records'].append(payload['records'][0])
        with self.assertRaises(ValidationError):Snapshot.model_validate(payload)
        payload=self.snapshot.model_dump(mode='json');payload['links']['x']=['unknown']
        with self.assertRaises(ValidationError):Snapshot.model_validate(payload)
    def test_manual_adapter_requires_permission_and_dated_official_records(self):
        path=Path(self.temp.name)/'import.json'
        with self.assertRaises(adapters.ManualImportRequired):adapters.myfuturejobs(path,NOW)
        # Validation-only fixture, explicitly never shipped as an actual source record.
        record=dict(source='myfuturejobs',id='TEST-ONLY',title='Validation fixture only',classification='test',classification_id='test',geography='MY',description='Synthetic import validation fixture; not official data.',url='https://myfuturejobs.gov.my/',published_at='2026-10-01',publication_note='TEST ONLY',version='test',license='TEST ONLY permission fixture',license_url=adapters.MY_TERMS)
        payload={'records':[record]};path.write_text(json.dumps(payload))
        with self.assertRaises(ValueError):adapters.myfuturejobs(path,NOW)
        payload['permission']={'redistribution_allowed':True,'evidence_url':adapters.MY_TERMS,'reviewed_by':'test fixture','reviewed_at':'2026-10-22'}
        path.write_text(json.dumps(payload));self.assertEqual(adapters.myfuturejobs(path,NOW)[0].geography,'MY')
        payload['records'][0]['published_at']=None;path.write_text(json.dumps(payload))
        with self.assertRaises(ValueError):adapters.myfuturejobs(path,NOW)
    def test_conditional_http_304_reuses_only_existing_cached_body(self):
        requests=[]
        def handle(req):
            requests.append(req)
            return httpx.Response(304) if req.headers.get('if-none-match')=='v1' else httpx.Response(200,text='public data',headers={'etag':'v1'})
        with httpx.Client(transport=httpx.MockTransport(handle)) as client:
            http=adapters.OfficialHTTP(self.cache,client);url='https://www.onetcenter.org/database.html'
            self.assertEqual(http.get(url),'public data');self.assertEqual(http.get(url),'public data')
            self.assertEqual(len(requests),2)
            with self.assertRaises(ValueError):http.get('https://unapproved.invalid/')
    def test_runtime_remote_outage_or_corruption_preserves_bundle(self):
        async def run():
            for response in [httpx.Response(503),httpx.Response(200,json={'bad':'schema'})]:
                async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req:response)) as client:
                    store=KnowledgeStore(client,ROOT/'data/knowledge/current.json');result=await store.get()
                    self.assertEqual(result['snapshot']['version'],self.snapshot.version)
                    self.assertEqual(result['delivery'],'last_valid');self.assertTrue(result['warning'])
        asyncio.run(run())
    def test_runtime_accepts_new_valid_release_and_rejects_record_loss(self):
        async def run():
            payload=self.snapshot.model_dump(mode='json');payload['version']='TEST-NEW'
            payload['verified_at']=(NOW+timedelta(days=30)).isoformat()
            payload['records'][0]['description']='New official fixture description'
            async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req:httpx.Response(200,json=payload))) as client:
                store=KnowledgeStore(client,ROOT/'data/knowledge/current.json')
                result=await store.get();self.assertEqual(result['snapshot']['version'],'TEST-NEW')
                self.assertEqual(result['delivery'],'published')
            payload['records']=payload['records'][:1];payload['links']={key:[] for key in payload['links']}
            async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req:httpx.Response(200,json=payload))) as client:
                store=KnowledgeStore(client,ROOT/'data/knowledge/current.json')
                result=await store.get();self.assertEqual(result['snapshot']['version'],self.snapshot.version)
                self.assertEqual(result['delivery'],'last_valid')
        asyncio.run(run())
    def test_daily_workflow_uses_persistent_due_branch_and_global_concurrency(self):
        workflow=(ROOT/'.github/workflows/career-data-sync.yml').read_text()
        for text in ["cron: '23 4 * * *'",'ref: career-data','cancel-in-progress: false','git push origin HEAD:career-data','data/knowledge/state.json']:
            self.assertIn(text,workflow)
        self.assertNotIn('--force-with-lease',workflow)

class AdapterContracts(unittest.TestCase):
    def test_onet_csv_contract_preserves_official_scales_dates_and_suppression(self):
        tables={
          'occupation_data':'O*NET-SOC Code,Title,Description\n13-1161.00,Test role,Official description\n',
          'essential_skills':'O*NET-SOC Code,Element ID,Element Name,Scale ID,Data Value,Recommend Suppress,Date\n13-1161.00,skill,Skill,IM,4,N,08/2023\n',
          'transferable_skills':'O*NET-SOC Code,Element ID,Element Name,Scale ID,Data Value,Recommend Suppress,Date\n13-1161.00,transfer,Transferable skill,IM,3,N,08/2023\n',
          'abilities':'O*NET-SOC Code,Element ID,Element Name,Scale ID,Data Value,Recommend Suppress,Date\n13-1161.00,ability,Ability,IM,4,N,08/2023\n13-1161.00,hidden,Suppressed,IM,1,Y,08/2023\n',
          'task_statements':'O*NET-SOC Code,Task ID,Task,Date\n13-1161.00,t,Task description,08/2023\n',
          'job_zones':'O*NET-SOC Code,Job Zone,Date\n13-1161.00,4,08/2023\n',
          'job_zone_reference':'Job Zone,Education\n4,US education context\n',
          'scales_reference':'Scale ID,Scale Name,Minimum,Maximum\nIM,Importance,1,5\n'}
        class HTTP:
            def get(self,url):
                if url==adapters.ONET_PAGE:return ''.join('<a href="/dl_files/database/db_31_0_csv/'+name+'.csv">csv</a>' for name in tables)
                return tables[Path(url).stem]
        records=adapters.onet(HTTP(),['13-1161.00'],NOW);r=records[0]
        self.assertEqual(len(r.skills),2);self.assertEqual(len(r.abilities),1)
        self.assertEqual(r.skills[0].value,4);self.assertIn('1–5',r.skills[0].scale)
        self.assertEqual(r.skills[0].date,'08/2023');self.assertIsNone(r.published_at)
    def test_esco_contract_preserves_essential_optional_relationships(self):
        uri='http://data.europa.eu/esco/occupation/test'
        d={'uri':uri,'className':'Occupation','preferredLabel':{'en':'Test occupation'},'description':{'en':{'literal':'Description'}},'code':'1234.1','_links':{'hasEssentialSkill':[{'uri':'http://data.europa.eu/esco/skill/test','title':'Test skill'}],'hasOptionalSkill':[{'uri':'http://data.europa.eu/esco/skill/other','title':'Optional skill'}]}}
        class HTTP:
            def get(self,url):return json.dumps(d)
        r=adapters.esco(HTTP(),{'13-1161.00':uri},NOW)[0]
        self.assertEqual([x.relation for x in r.skills],['hasEssentialSkill','hasOptionalSkill'])
        self.assertTrue(r.version.startswith('api-default-sha256:'))
        self.assertEqual(r.geography,'EU');self.assertIsNone(r.published_at)

if __name__=='__main__':unittest.main()
