import copy
import json
import unittest
from src.malaysia_intelligence import Intelligence

class IntelligenceTests(unittest.TestCase):
 def setUp(self):self.engine=Intelligence()
 def test_lossless_legacy_tables(self):
  from src.malaysia_intelligence.engine import ROOT
  original=json.loads((ROOT/'data/malaysia_intelligence/pilot-original.json').read_text(encoding='utf-8'))
  for name,rows in original['tables'].items():
   self.assertEqual(rows,self.engine.tables[name][:len(rows)],name)
 def test_missing_is_not_gap(self):
  r=self.engine.assess('software')
  self.assertTrue(all(x['state']=='unknown' for x in r['skill_gaps']))
  self.assertTrue(all(x['status']=='unknown' for x in r['scenarios']))
 def test_false_is_gap(self):
  r=self.engine.assess('software',{'skills':{'sql':False}})
  self.assertEqual(next(x for x in r['skill_gaps'] if x['skill_id']=='sql')['state'],'reported_gap')
 def test_all_conditions_and_no_mutation(self):
  profile={'skills':{'sql':True,'api':True}}
  before=copy.deepcopy(profile)
  r=self.engine.assess('software',profile)
  self.assertEqual(r['scenarios'][1]['status'],'unknown')
  r=self.engine.assess('software',profile,{'conditions':{'authorised_data_and_review':True}})
  self.assertEqual(r['scenarios'][1]['status'],'conditional')
  self.assertEqual(profile,before)
  self.assertEqual(self.engine.assess('software',profile)['scenarios'][1]['status'],'unknown')
  self.assertEqual(r['personal_fit'],'not_assessed')
 def test_reject_questionnaire_and_numeric_skill(self):
  for profile in [{'answers':{'SW1':7}},{'skills':{'sql':7}},{'skills':{'invented':True}}]:
   with self.assertRaises(ValueError):self.engine.assess('software',profile)
 def test_trace_exists(self):
  r=self.engine.assess('environment')
  self.assertTrue(all(s['evidence']['records'] and s['evidence']['sources'] for s in r['scenarios']))
 def test_archival_erratum_is_applied_to_effective_evidence(self):
  r=next(r for r in self.engine.career('environment')['salary_and_entry'] if r['record_id']=='04-010')
  self.assertEqual(r['evidence_type'],'INFERENCE')
  self.assertEqual(r['original_evidence_type'],'MY-OFFICIAL')
  self.assertEqual(self.engine.records[('Malaysia Salary & Skills','04-010')]['evidence_type'],'MY-OFFICIAL')
  self.assertTrue(r['correction_note'])
 def test_absent_vacancy_at_one_employer_is_not_national_zero(self):
  r=self.engine.assess('marine')
  self.assertTrue(r['market'])
  self.assertIn('没有空缺',r['market'][0]['finding_zh'])
  self.assertEqual(r['personal_fit'],'not_assessed')
  self.assertIsNone(r['outlook_score'])

 def test_all_24_actual_ids_names_and_dimensions(self):
  from src.malaysia_intelligence.engine import ROOT
  actual=json.loads((ROOT/'prototype/explorer-catalog.json').read_text(encoding='utf-8'))['careers']
  self.assertEqual({c['id'] for c in actual},set(self.engine.catalog))
  for c in actual:
   imported=self.engine.catalog[c['id']]
   self.assertEqual([imported['title_en'],imported['title_zh'],imported['title_ms']],c['title'])
   r=self.engine.assess(c['id'])
   self.assertEqual(len(r['profiles']),9)
   self.assertGreaterEqual(len(r['tasks']),5)
   self.assertGreaterEqual(len(r['ai_tasks']),5)
   self.assertEqual(len(r['scenarios']),3)
   self.assertTrue(r['mapping'] and r['salary_and_entry'] and r['regions'] and r['relations'])

 def test_all_rules_require_each_predicate_and_preserve_remaining_gaps(self):
  for occ in self.engine.catalog:
   for rule in self.engine.assess(occ)['scenarios']:
    profile={};assumed={}
    for p in rule['all_of']:assumed.setdefault(p['field'],{})[p['key']]=True
    before=copy.deepcopy(assumed)
    result=self.engine.assess(occ,profile,assumed)
    selected=next(s for s in result['scenarios'] if s['id']==rule['id'])
    self.assertEqual(selected['status'],'conditional')
    self.assertIsNone(selected['success_probability'])
    self.assertTrue(selected['target_requirements_to_verify'])
    self.assertEqual(assumed,before);self.assertEqual(profile,{})
    for p in rule['all_of']:
     trial=copy.deepcopy(assumed);trial[p['field']][p['key']]=False
     self.assertEqual(next(s for s in self.engine.assess(occ,{},trial)['scenarios'] if s['id']==rule['id'])['status'],'unmet')

 def test_unknown_salary_is_null_and_sourced_pay_has_scope(self):
  for r in self.engine.tables['Malaysia Salary & Skills']:
   if 'salary_min' not in r:continue
   if r['evidence_type']=='UNKNOWN':
    self.assertIsNone(r['salary_min']);self.assertIsNone(r['salary_max'])
   elif r['salary_min'] is not None:
    self.assertEqual(r['currency'],'RM');self.assertNotEqual(r['pay_period'],'Unknown')
    self.assertTrue(r.get('salary_statistic'))

 def test_mapping_and_decision_claims_have_sources_and_no_invented_scores(self):
  for occ in self.engine.catalog:
   r=self.engine.assess(occ)
   for record in r['mapping']+r['market']+r['ai_tasks']+r['profiles']:
    self.assertTrue(record['source_ids']);self.assertTrue(record['limitations'])
    self.assertIn(record['evidence_type'],{'MY-OFFICIAL','RESEARCH','INFERENCE','UNKNOWN'})
   self.assertTrue(all(t['human_responsibility'] for t in r['ai_tasks']))
   self.assertIsNone(r['ai_exposure_score']);self.assertIsNone(r['outlook_score'])

 def test_critical_local_mapping_does_not_use_isco_as_masco(self):
  self.assertEqual({r['masco_code'] for r in self.engine.career('writing')['mapping']},{'2831'})
  self.assertIn('2543',{r['masco_code'] for r in self.engine.career('ux')['mapping']})
  self.assertNotIn('2641',{r['masco_code'] for r in self.engine.career('writing')['mapping']})

 def test_actual_semantic_differences_between_careers(self):
  tasksets=[tuple(t['topic'] for t in self.engine.career(occ)['tasks']) for occ in self.engine.catalog]
  self.assertEqual(len(set(tasksets)),24)
  self.assertIn('现场',''.join(r['human_responsibility'] for r in self.engine.career('water')['ai_tasks']))

if __name__=='__main__':unittest.main()
