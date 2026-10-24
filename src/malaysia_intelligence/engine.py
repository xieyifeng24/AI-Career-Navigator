import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class Intelligence:
    def __init__(self, path=None):
        self.data = json.loads(Path(path or ROOT/'data/malaysia_intelligence/current.json').read_text(encoding='utf-8'))
        self.tables = self.data['tables']
        self.catalog = {r['occupation_id']: r for r in self.tables['Career Catalog 24']}
        self.sources = {r['source_id']: r for r in self.tables['Evidence & Sources']}
        self.records = {(name, r['record_id']): r for name, rows in self.tables.items() for r in rows if 'record_id' in r}
        self.model = self.data['analysis_model']
        self.validate()

    def validate(self):
        if len(self.catalog) != 24:
            raise ValueError('Expected 24 original career IDs')
        for name, rows in self.tables.items():
            keys = [r['record_id'] for r in rows if 'record_id' in r]
            if len(keys) != len(set(keys)):
                raise ValueError('Duplicate record IDs: '+name)
            for r in rows:
                if any(s not in self.sources for s in r.get('source_ids', '').split(';') if s):
                    raise ValueError('Unresolved source')
                if r.get('occupation_id') not in (None, 'ALL') and r['occupation_id'] not in self.catalog:
                    raise ValueError('Unknown occupation')
        for collection in ['requirements', 'scenarios']:
            ids = [r['id'] for r in self.model[collection]]
            if len(ids) != len(set(ids)):
                raise ValueError('Duplicate model ID')
            for r in self.model[collection]:
                if r['occupation_id'] not in self.catalog:
                    raise ValueError('Unknown model occupation')
                if r.get('target_occupation_id', r['occupation_id']) not in self.catalog:
                    raise ValueError('Unknown scenario target')
                if 'skill_id' in r and r['skill_id'] not in self.model['skills']:
                    raise ValueError('Unknown requirement skill')
                for ref in r['record_refs']:
                    if (ref['table'], ref['record_id']) not in self.records:
                        raise ValueError('Unresolved evidence record')
                for skill in r.get('skills', []):
                    if skill not in self.model['skills']:
                        raise ValueError('Unknown skill')

    def evidence(self, refs):
        records = [self.effective(r['table'], self.records[(r['table'], r['record_id'])]) for r in refs]
        ids = sorted({s for r in records for s in r.get('source_ids', '').split(';') if s})
        return {'records': records, 'sources': [copy.deepcopy(self.sources[s]) for s in ids]}

    def effective(self, table, row):
        result = copy.deepcopy(row)
        override = self.data.get('record_overrides', {}).get(table+'#'+row.get('record_id', ''), {})
        if override:
            result['original_evidence_type'] = result.get('evidence_type')
            result.update(copy.deepcopy(override))
        return result

    def career(self, occupation_id):
        if occupation_id not in self.catalog:
            raise KeyError(occupation_id)
        result = {'occupation': copy.deepcopy(self.catalog[occupation_id]), 'snapshot': self.data['version'],
                  'research_status': self.data.get('stage', 'UNKNOWN'),
                  'market': [], 'ai_tasks': [], 'paths': [], 'relations': [], 'requirements': [],
                  'profiles': [], 'mapping': [], 'salary_and_entry': [], 'regions': [], 'tasks': [],
                  'personal_fit': 'not_assessed', 'outlook_score': None, 'ai_exposure_score': None}
        for table, output in [('Malaysia Job Demand', 'market'), ('Malaysia AI Transformation', 'ai_tasks'),
                              ('Career Paths & What If', 'paths'), ('Career Relations', 'relations'),
                              ('Malaysia Career Profiles', 'profiles'), ('MASCO Occupation Mapping', 'mapping'),
                              ('Malaysia Salary & Skills', 'salary_and_entry'), ('Malaysia Regional Opportunities', 'regions'),
                              ('Occupation Tasks', 'tasks')]:
            result[output] = [self.effective(table, r) for r in self.tables[table] if r['occupation_id'] == occupation_id]
        result['requirements'] = [copy.deepcopy(r) for r in self.model['requirements'] if r['occupation_id'] == occupation_id]
        return result

    def assess(self, occupation_id, profile=None, assumptions=None):
        result = self.career(occupation_id)
        profile = copy.deepcopy(profile or {})
        assumptions = copy.deepcopy(assumptions or {})
        allowed = {'skills', 'projects', 'conditions'}
        for obj in [profile, assumptions]:
            if set(obj)-allowed:
                raise ValueError('Only explicit skills, projects and conditions are accepted; questionnaire values are not skill evidence')
            for field, facts in obj.items():
                if not isinstance(facts, dict) or any(type(v) is not bool for v in facts.values()):
                    raise ValueError('Explicit boolean statements required; absent means unknown')
                if field == 'skills' and set(facts)-self.model['skills'].keys():
                    raise ValueError('Unrecognised skill identifier')
        def state(field, key):
            if key in assumptions.get(field, {}):
                return assumptions[field][key], 'hypothetical'
            if key in profile.get(field, {}):
                return profile[field][key], 'self_reported'
            return None, 'not_reported'
        result['skill_gaps'] = []
        for req in result['requirements']:
            value, basis = state('skills', req['skill_id'])
            result['skill_gaps'].append({**req, 'state': 'unknown' if value is None else 'reported_met' if value else 'reported_gap',
                                         'basis': basis, 'verified_ability': False})
        result['scenarios'] = []
        for rule in self.model['scenarios']:
            if rule['occupation_id'] != occupation_id:
                continue
            evaluated = [{**p, 'value': state(p['field'], p['key'])[0], 'basis': state(p['field'], p['key'])[1]}
                         for p in rule['all_of']]
            status = 'unmet' if any(p['value'] is False for p in evaluated) else 'unknown' if any(p['value'] is None for p in evaluated) else 'conditional'
            result['scenarios'].append({**copy.deepcopy(rule), 'status': status, 'evaluated': evaluated,
                                        'evidence': self.evidence(rule['record_refs']), 'success_probability': None,
                                        'target_requirements_to_verify': [copy.deepcopy(r) for r in self.model['requirements']
                                            if r['occupation_id']==rule['target_occupation_id'] and state('skills',r['skill_id'])[0] is not True]})
        # Missing knowledge and a stated gap require different actions.
        result['next_actions'] = [{'skill_id': r['skill_id'], 'action': 'request_practice_evidence' if r['state']=='unknown' else 'practice',
                                    'suggestion': r['practice'], 'record_refs': r['record_refs']}
                                   for r in result['skill_gaps'] if r['state'] != 'reported_met']
        result['assumptions'] = assumptions
        result['eligibility'] = 'not_determined'
        return result
