"""Contract tests only. No paid inference or static replacement reports."""
import copy
import json
import unittest
from pydantic import ValidationError
from src.career.models import Profile, Answers, OPTIONS
from src.career.inference import make_messages, output_schema, LANGUAGE_RULES
from src.career.matching import rank_roles
from career_fixtures import profile, snapshot


def structured(**changes):
    return dict(background='marketing', experience='3to5', tasks=['write', 'research'],
                skills=['writing', 'critical'], aiUsage='frequent', concerns=['automation', 'skills'],
                goal='upgrade', constraints=['budget'], custom={}) | changes


class QuestionnaireContracts(unittest.TestCase):
    def test_old_text_contract_remains_compatible_and_defaults_to_english(self):
        p = profile()
        self.assertEqual(p.language, 'en')
        self.assertIsNone(p.answers)
        self.assertEqual(p.concerns, 'Repetitive tasks')

    def test_structured_answers_alone_populate_required_legacy_analysis_fields(self):
        p = Profile(answers=structured(), hours=3, synthetic=True, language='ms')
        self.assertEqual(p.aiUse, 'Frequently use AI')
        self.assertIn('AI may replace parts of my work', p.concerns)
        self.assertIn('Research information and compare sources', p.tasks)
        self.assertEqual(p.answers.aiUsage, 'frequent')
        self.assertEqual(p.answers.concerns, ['automation', 'skills'])
        self.assertEqual(p.model_dump()['language'], 'ms')

    def test_conflicting_client_text_cannot_override_structured_selections(self):
        p = profile(answers=structured(), aiUse='I never use AI', concerns='Nothing to analyze')
        self.assertEqual(p.aiUse, 'Frequently use AI')
        self.assertIn('which AI skills', p.concerns)

    def test_all_locales_keep_the_same_canonical_matching_and_send_the_actual_answers(self):
        rankings = []
        for language, (name, prefixes) in LANGUAGE_RULES.items():
            p = Profile(answers=structured(), language=language, hours=3, synthetic=True)
            s = snapshot()
            rankings.append(rank_roles(p, s['roles']))
            messages = make_messages(p, s, rankings[-1])
            self.assertIn('OUTPUT LANGUAGE: ' + name, messages[0]['content'])
            if language != 'en':
                self.assertNotIn('Write concise English', messages[0]['content'])
            sent = json.loads(messages[1]['content'])['profile']
            self.assertEqual(sent['answers']['concerns'], ['automation', 'skills'])
            self.assertEqual(sent['language'], language)
            self.assertEqual(sent['aiUse'], 'Frequently use AI')
            self.assertIn('AI may replace parts of my work', sent['concerns'])
            schema = output_schema(p, s)
            independent = schema['properties']['capabilities']['properties']['independent']
            self.assertTrue(independent['properties']['assessment']['properties']['text']['pattern'].startswith('^' + prefixes[0]))
            self.assertEqual(schema['$defs']['Week']['properties']['hours']['maximum'], 3)
        self.assertEqual(rankings[0], rankings[1])
        self.assertEqual(rankings[1], rankings[2])

    def test_ai_usage_and_concerns_change_model_context(self):
        s = snapshot()
        a = profile(answers=structured(aiUsage='never', concerns=['none']))
        b = profile(answers=structured(aiUsage='advanced', concerns=['direction']))
        self.assertNotEqual(make_messages(a, s, []), make_messages(b, s, []))
        self.assertEqual(a.aiUse, 'Never used AI tools')
        self.assertEqual(a.concerns, 'No major concerns')

    def test_invalid_ids_duplicates_mutually_exclusive_answers_and_missing_custom_are_rejected(self):
        cases = [dict(aiUsage='translated-label'), dict(concerns=['none', 'skills']),
                 dict(concerns=['none', 'other'], custom={'concerns': 'Example'}),
                 dict(constraints=['none', 'budget']), dict(concerns=['skills', 'skills']),
                 dict(tasks=['write']), dict(skills=[]), dict(goal='other'), dict(custom={'unknown': 'x'})]
        for changes in cases:
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                Profile(answers=structured(**changes), hours=3, synthetic=True)
        with self.assertRaises(ValidationError):
            Profile(answers=structured(), hours=3, synthetic=True, language='fr')

    def test_custom_only_skills_are_supported_and_all_custom_answers_reach_inference(self):
        custom = {'skills': 'Fictional process review', 'concerns': 'A fictional worry', 'background': 'Fictional researcher'}
        p = Profile(answers=structured(skills=['other'], concerns=['other'], background='other', custom=custom), hours=2, synthetic=True)
        self.assertEqual(p.skills, custom['skills'])
        self.assertEqual(p.concerns, custom['concerns'])
        self.assertEqual(p.background, custom['background'])
        self.assertIn(custom['concerns'], make_messages(p, snapshot(), [])[1]['content'])

    def test_custom_contact_information_and_excessive_lengths_are_rejected(self):
        for custom in [{'concerns': 'private@example.com'}, {'concerns': 'x'*501}]:
            with self.assertRaises(ValidationError):
                Profile(answers=structured(concerns=['other'], custom=custom), hours=3, synthetic=True)
        with self.assertRaises(ValidationError):
            Profile(answers=structured(background='other', custom={'background':'x'*181}), hours=3, synthetic=True)

    def test_each_public_option_is_accepted_by_the_same_shared_backend_contract(self):
        for field, rows in OPTIONS.items():
            for value, *_ in rows:
                data = structured()
                data[field] = ['write', value] if field == 'tasks' and value != 'write' else ['write', 'research'] if field == 'tasks' else [value] if field in {'skills','concerns','constraints'} else value
                if value == 'other': data['custom'][field] = 'A short fictional example'
                with self.subTest(field=field, value=value): Answers.model_validate(data)


if __name__ == '__main__':
    unittest.main()
