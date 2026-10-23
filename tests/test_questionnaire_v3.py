"""Phase-one preview assets preserve stable V2 behavior and source integrity."""
import hashlib
import json
from pathlib import Path
import unittest
from fastapi.testclient import TestClient
from src.career.api import app
ROOT=Path(__file__).resolve().parents[1]

class QuestionnaireV3Preview(unittest.TestCase):
    def test_bank_integrity_and_session_composition(self):
        raw=(ROOT/'prototype/v3/bank.json').read_bytes()
        manifest=json.loads((ROOT/'prototype/v3/source-manifest.json').read_text())
        self.assertEqual(hashlib.sha256(raw).hexdigest(),manifest['sha256'])
        bank=json.loads(raw)
        self.assertEqual(bank['defaultLanguage'],'en')
        self.assertEqual(len(bank['questions']),84)
        for track in bank['tracks']:
            questions=[q for q in bank['questions'] if q['trackId'] in ['GENERAL',track['id']]]
            self.assertEqual(len(questions),12)
            for q in questions:
                self.assertEqual(set(q['statement']),{'en','zh-CN','ms'})
                self.assertTrue(q['allowNotApplicable'])
    def test_preview_and_stable_assets_are_same_origin_and_allowlisted(self):
        with TestClient(app) as client:
            page=client.get('/?assessment=v3')
            self.assertEqual(page.status_code,200)
            self.assertIn('./bootstrap.js',page.text)
            self.assertEqual(client.get('/bootstrap.js').status_code,200)
            for asset in ['bank.json','engine.js','ui.js','app.js','styles.css']:
                response=client.get('/v3/'+asset)
                self.assertEqual(response.status_code,200)
                self.assertIn("script-src 'self'",response.headers['content-security-policy'])
            for asset in ['source-manifest.json','.env','scoring.json','report.js']:
                self.assertEqual(client.get('/v3/'+asset).status_code,404)
            for path in ['/app.js','/intro.js','/exploration/bank.json','/exploration/scoring.json','/local/engine.js','/data/knowledge/current.json']:
                self.assertEqual(client.get(path).status_code,200)
