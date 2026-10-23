import json
from pathlib import Path
import unittest
from fastapi.testclient import TestClient
from src.career.api import app
from src.career.models import Profile
ROOT=Path(__file__).resolve().parents[1]

class QuestionnaireV2Contracts(unittest.TestCase):
    def test_actual_frontend_optional_payloads_satisfy_unchanged_protected_api(self):
        # JS tests independently regenerate these actual serializer outputs and compare them.
        payloads=json.loads((ROOT/'tests/fixtures/questionnaire-v2-optional.json').read_text())
        self.assertEqual(len(payloads),10)
        for payload in payloads:
            parsed=Profile.model_validate(payload)
            self.assertTrue(parsed.synthetic)
            self.assertNotIn('exploration',payload)
            self.assertLessEqual(len(parsed.additionalContext),1600)
            self.assertIn('not validated aptitude',parsed.additionalContext)
    def test_only_allowlisted_frontend_assets_are_served(self):
        with TestClient(app) as client:
            for filename in ['bank.json','scoring.json','projects.json','engine.js','report.js','ui.js']:
                response=client.get('/exploration/'+filename)
                self.assertEqual(response.status_code,200)
            self.assertEqual(client.get('/exploration/source-manifest.json').status_code,404)
            self.assertEqual(client.get('/exploration/.env').status_code,404)
    def test_direction_mappings_never_replace_existing_official_database(self):
        catalog=json.loads((ROOT/'data/knowledge/current.json').read_text())
        self.assertEqual(len(catalog['records']),10)
        self.assertEqual({r['source'] for r in catalog['records']},{'onet','esco'})

if __name__=='__main__':unittest.main()
