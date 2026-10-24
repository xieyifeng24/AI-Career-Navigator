"""Semantic answer API contract and optional-AI evidence validation."""
import json
import unittest
from pathlib import Path
from pydantic import ValidationError
from src.career.assessment_ai import GuideRequest, canonical, candidates, BEHAVIORS

BANK=json.loads((Path(__file__).resolve().parents[1]/'prototype/v3/bank.json').read_text())

class BehaviorContractTests(unittest.TestCase):
    def request(self,track='SW',language='en'):
        rows=[q for q in BANK['questions'] if q['trackId'] in {'GENERAL',track}]
        return GuideRequest(track_id=track,language=language,answers={q['id']:[BEHAVIORS['constructs'][q['construct']][0]['id']] for q in rows})
    def test_all_directions_and_languages_use_approved_behavior_labels(self):
        for track in BANK['tracks']:
            for language in BANK['languageCodes']:
                request=self.request(track['id'],language)
                self.assertEqual(len(canonical(request,BANK)),12)
                guide=candidates(request,BANK)
                self.assertEqual(len(guide),12)
                self.assertTrue(all(item['evidence_ids']==[item['id']] for item in guide))
                self.assertNotIn('[object Object]',json.dumps(guide))
    def test_exclusive_limit_duplicates_types_and_foreign_options_rejected(self):
        for invalid in [[],['none','learn'],['learn']*2,['a','b','c','d'],[True],8,'6',True]:
            payload=self.request().model_dump();payload['answers']['G03']=invalid
            with self.assertRaises(ValidationError):GuideRequest(**payload)
        request=self.request();request.answers['G03']=['artifact']
        with self.assertRaises(ValueError):canonical(request,BANK)
    def test_ai_conflict_is_derived_from_same_format_evidence_only(self):
        request=self.request();request.answers['G03']=['workflow'];request.answers['SW07']=['none']
        self.assertIn('tension-ai_practice',[c['id'] for c in candidates(request,BANK)])
        request.answers['SW07']=2
        self.assertNotIn('tension-ai_practice',[c['id'] for c in candidates(request,BANK)])
    def test_historical_scale_keeps_exact_original_meaning(self):
        request=self.request();request.answers={k:6 for k in request.answers}
        guide=candidates(request,BANK)
        label=next(s['label']['en'] for s in BANK['scale'] if s['value']==6)
        self.assertTrue(all(label in item['text'] for item in guide))
