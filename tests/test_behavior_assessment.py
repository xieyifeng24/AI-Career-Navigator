"""Current direction assessment is scalar; behavior arrays are never scored by the API."""
import json
import unittest
from pathlib import Path
from pydantic import ValidationError
from src.career.assessment_ai import GuideRequest, canonical, candidates
BANK=json.loads((Path(__file__).resolve().parents[1]/'prototype/v3/bank.json').read_text())
class DirectionContractTests(unittest.TestCase):
    def request(self,track='SW',language='en'):
        rows=[q for q in BANK['questions'] if q['trackId'] in {'GENERAL',track}]
        return GuideRequest(track_id=track,language=language,answers={q['id']:5 for q in rows})
    def test_all_directions_and_languages_use_original_degree_semantics(self):
        for track in BANK['tracks']:
            for language in BANK['languageCodes']:
                r=self.request(track['id'],language)
                self.assertEqual(len(canonical(r,BANK)),12)
                label=next(s['label'][language] for s in BANK['scale'] if s['value']==5)
                self.assertTrue(all(label in c['text'] for c in candidates(r,BANK)))
    def test_behavior_arrays_duplicates_and_wrong_scalar_types_are_rejected(self):
        for value in [[],['code'],['learn','workflow'],8,'6',True]:
            p=self.request().model_dump();p['answers']['G03']=value
            with self.assertRaises(ValidationError):GuideRequest(**p)
    def test_daily_and_professional_differences_are_not_conflicts(self):
        r=self.request();r.answers['G03']=7;r.answers['SW07']=1
        self.assertFalse(any(c['id'].startswith('tension-') for c in candidates(r,BANK)))
    def test_seven_scalar_values_keep_their_original_semantics(self):
        for v in range(1,8):
            r=self.request();r.answers={k:v for k in r.answers}
            label=next(s['label']['en'] for s in BANK['scale'] if s['value']==v)
            self.assertTrue(all(label in c['text'] for c in candidates(r,BANK)))
