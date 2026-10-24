"""Frontend-produced current intake fixtures must retain meaning at the optional API boundary."""
import copy
import json
import unittest
from pathlib import Path
from pydantic import ValidationError
from src.career.regional_ai import RegionalRequest, intake_semantics
FIXTURES=json.loads((Path(__file__).resolve().parents[1]/'docs/release/emergency-20261024/intake-contract-fixtures.json').read_text())
class MultiIntakeContractTests(unittest.TestCase):
    def request(self,answers):
        return RegionalRequest(answers=FIXTURES['freshman']['directionAnswers'],deterministic_profile=['Fictional QA fixture'],understand_you=answers)
    def test_six_browser_schema_personas_are_accepted_with_all_selections(self):
        for name,fixture in FIXTURES.items():
            with self.subTest(name=name):
                r=self.request(fixture['answers'])
                self.assertEqual(r.understand_you,fixture['answers'])
                semantics={row['id']:row['meaning'] for row in intake_semantics(r.understand_you)}
                for key in ['Q04','Q06','Q07','Q08','Q12','Q13']:
                    self.assertEqual(len(semantics[key]),len(fixture['answers'][key]))
                self.assertEqual(len(semantics['Q09']['selected']),2)
    def test_primary_outside_selection_and_duplicate_or_exclusive_sets_are_rejected(self):
        for key,value in [('Q02',{'selected':['B'],'primary':'H'}),('Q09',{'selected':['A'],'primary':'B'}),('Q06',['A','C']),('Q13',['none','api']),('Q04',['A','A'])]:
            a=copy.deepcopy(FIXTURES['freshman']['answers']);a[key]=value
            with self.subTest(key=key),self.assertRaises(ValidationError):self.request(a)
    def test_matrix_levels_remain_scalars_and_free_text_is_rejected(self):
        for alteration in ['matrix','story']:
            a=copy.deepcopy(FIXTURES['freshman']['answers'])
            if alteration=='matrix':a['Q05']['execution']=['examples','independent']
            else:a['story']='Not consented'
            with self.assertRaises(ValidationError):self.request(a)
