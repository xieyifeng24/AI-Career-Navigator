"""Reviewed regional pilot data. Market facts never change questionnaire scores.

DOSM and World Bank are refreshed from public APIs. The BLS and MyCOL entries are
reviewed official-table extracts; a failed refresh retains the last valid snapshot.
"""
import csv
import fcntl
from datetime import datetime, timedelta, timezone
import hashlib
import io
import json
from pathlib import Path
import tempfile
import asyncio
import time
from urllib.parse import urlsplit

import httpx

from .knowledge.schema import Snapshot as KnowledgeSnapshot

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data/regional'
DOSM_URL = 'https://storage.dosm.gov.my/labour/wages_occupation.csv'
WB_URL = 'https://api.worldbank.org/v2/country/MYS;USA/indicator/SL.UEM.TOTL.ZS?format=json&per_page=500'
MYCOL_URL = 'https://www.talentcorp.com.my/images/uploads/publication/204/MyMahir-Malaysia-Critical-Occupations-List-MyCOL20242025-1773385490.pdf'
MASCO_URL = 'https://myjobprofile.dosm.gov.my/bda-myjobprofile/job/2512/software-developers'
BLS_URL = 'https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm'


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=path.parent, suffix='.tmp', delete=False) as handle:
        temp = Path(handle.name)
        json.dump(value, handle, ensure_ascii=False, indent=2, allow_nan=False)
        handle.write('\n')
        handle.flush()
    temp.replace(path)


def fact(source_name, source_url, region, occupation_code, metric, value, unit,
         reference_period, granularity, mapping_status, retrieved_at,
         published_at=None, source_version=None, note=None, role_id=None):
    return dict(source_name=source_name, source_url=source_url, region=region,
                occupation_code=occupation_code, metric=metric, value=value, unit=unit,
                reference_period=reference_period, published_at=published_at,
                retrieved_at=retrieved_at, granularity=granularity,
                mapping_status=mapping_status, source_version=source_version,
                note=note, role_id=role_id)


def validate(snapshot):
    if snapshot.get('schema_version') != 1 or not snapshot.get('facts'):
        raise ValueError('Invalid regional snapshot')
    ids = {r['role_id'] for r in snapshot['mappings']}
    if ids != {'software', 'ai-research'}:
        raise ValueError('Missing pilot mapping')
    mappings={r['role_id']:r for r in snapshot['mappings']}
    if mappings['software'].get('masco_code')!='2512' or mappings['software'].get('onet_soc_code')!='15-1252.00':
        raise ValueError('Reviewed software mapping changed')
    if any(mappings['ai-research'].get(k) is not None for k in ('masco_code','onet_soc_code','esco_uri')):
        raise ValueError('Unverified AI occupation equivalence')
    allowed={'storage.dosm.gov.my','myjobprofile.dosm.gov.my','www.talentcorp.com.my',
             'www.onetonline.org','www.onetcenter.org','esco.ec.europa.eu',
             'api.worldbank.org','www.bls.gov'}
    for row in snapshot['facts']:
        required = {'source_name','source_url','region','occupation_code','metric','value',
                    'unit','reference_period','published_at','retrieved_at','granularity',
                    'mapping_status','role_id'}
        parsed=urlsplit(row.get('source_url',''))
        if not required <= row.keys() or parsed.scheme!='https' or parsed.hostname not in allowed:
            raise ValueError('Incomplete fact provenance')
        if row['role_id'] not in ids and row['role_id'] is not None:
            raise ValueError('Unknown role')
        if row['region'] not in {'MY','US','GLOBAL'}:
            raise ValueError('Invalid region')
        if row['metric']=='median_monthly_wages_professionals' and (row['role_id'] is not None or row['granularity'].find('major group')<0):
            raise ValueError('Broad Malaysian wage misattributed')
        if row['role_id']=='ai-research' and row['metric'] in {'median_annual_wage','employment_change_projection'}:
            raise ValueError('AI occupation statistic lacks an exact mapping')
    return snapshot


def current(directory=DATA):
    return validate(json.loads((Path(directory)/'current.json').read_text()))


def dosm_rows(text, now):
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows or not {'date','sex','occupation','wages_median','wages_mean'} <= set(rows[0]):
        raise ValueError('DOSM format changed')
    latest = max(r['date'] for r in rows)
    selected = [r for r in rows if r['date'] == latest and r['sex'] == 'both' and r['occupation'] == 'professionals']
    if len(selected) != 1: raise ValueError('DOSM professionals row unavailable')
    value = float(selected[0]['wages_median'])
    if not 0 < value < 1_000_000: raise ValueError('Invalid DOSM wage')
    return [fact('DOSM / OpenDOSM', DOSM_URL, 'MY', 'MASCO major group 2',
                 'median_monthly_wages_professionals', value, 'MYR per month', latest[:4],
                 'MASCO major group; all professionals, not software developers',
                 'broad-context-only', now, note='Citizens aged 15–64 in the dataset coverage; not a software occupation wage.', role_id=None)]


def world_bank_rows(payload, now):
    if not isinstance(payload, list) or len(payload) != 2 or not isinstance(payload[1], list):
        raise ValueError('World Bank format changed')
    output = []
    for code in ('MYS','USA'):
        rows = [r for r in payload[1] if r.get('countryiso3code') == code and r.get('value') is not None]
        if not rows: raise ValueError('World Bank country missing')
        row = max(rows, key=lambda r:r['date'])
        value = float(row['value'])
        if not 0 <= value <= 100: raise ValueError('Invalid unemployment rate')
        output.append(fact('World Bank Indicators / modeled ILO estimate', WB_URL,
            'GLOBAL', code, 'national_unemployment_rate', value, '% of total labour force',
            row['date'], 'whole economy, all occupations', 'country-context-only', now,
            source_version='World Bank API source 2; last updated '+str(payload[0].get('lastupdated')),
            note='National context, not occupation-specific demand or career fit.', role_id=None))
    return output


def occupational_facts(knowledge, now):
    records = {r.source+':'+r.id:r for r in KnowledgeSnapshot.model_validate(knowledge).records}
    out = []
    for role, code, esco_uri, mapping in [
        ('software','15-1252.00','http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1','reviewed-contextual'),
        ('ai-research','15-1221.00','http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8','related-only')]:
        onet = records['onet:'+code]
        esco = records['esco:'+esco_uri]
        unique_skills=[]
        for item in onet.skills:
            if item.label not in {skill.label for skill in unique_skills}: unique_skills.append(item)
            if len(unique_skills)==4: break
        for metric, values in [('task',onet.tasks[:3]),('skill',unique_skills)]:
            for item in values:
                out.append(fact('O*NET Database',onet.url,'US',code,metric,item.label,None,
                    onet.version,'O*NET-SOC detailed occupation',mapping,now,
                    published_at=onet.published_at.isoformat() if onet.published_at else None,
                    source_version=onet.version,role_id=role))
        for item in esco.skills[:6]:
            out.append(fact('ESCO',esco.url,'GLOBAL',esco_uri,'transferable_skill_reference',
                item.label,None,esco.version,'European ESCO occupation and skill relation',mapping,
                now,source_version=esco.version,role_id=role,
                note='European classification reference; not global labour market statistics.'))
    return out


def seed(now, knowledge):
    # Reviewed official releases. Future checks do not silently mark these as newly published.
    facts = occupational_facts(knowledge,now)
    facts += [fact('TalentCorp MyCOL',MYCOL_URL,'MY','MASCO 2512','critical_occupation_listed',
        True,None,'2024/2025','MASCO 4-digit occupation','reviewed-contextual',now,
        note='Software developers listed; annual shortage signal, not a vacancy count.',role_id='software'),
      fact('MASCO / DOSM MyJobProfile',MASCO_URL,'MY','MASCO 2512','task',
        'Study and evaluate requirements for software applications and operating systems.',None,
        'MASCO 2020','MASCO 4-digit software developers','reviewed-contextual',now,
        note='Official occupation description; not a current vacancy count.',role_id='software'),
      fact('MASCO / DOSM MyJobProfile',MASCO_URL,'MY','MASCO 2512','task',
        'Design, develop, test and maintain software solutions to meet requirements.',None,
        'MASCO 2020','MASCO 4-digit software developers','reviewed-contextual',now,
        note='Official occupation description; not a verified individual skill.',role_id='software'),
      fact('BLS Employment Projections',BLS_URL,'US','SOC 15-1252','employment_change_projection',
        10.2,'% change','2025–2035','SOC detailed occupation: software developers',
        'reviewed-contextual',now,source_version='Table 1.2, 2025–2035',role_id='software',
        note='US occupational projection, not an AI replacement rate or Malaysia forecast.'),
      fact('BLS Employment Projections',BLS_URL,'US','SOC 15-1252','median_annual_wage',
        135980,'USD per year','2025','SOC detailed occupation: software developers',
        'reviewed-contextual',now,source_version='Table 1.2, 2025–2035',role_id='software',
        note='US median wage; not comparable to the DOSM professionals group or Malaysian salary.')]
    mappings = [dict(role_id='software',display_name='Software Developer',masco_code='2512',
        isco_code=None,onet_soc_code='15-1252.00',
        esco_uri='http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1',
        relationship='reviewed contextual correspondence; classification scopes differ',
        review_status='reviewed-contextual',regions=['MY','US','GLOBAL'],
        source_urls=['https://myjobprofile.dosm.gov.my/bda-myjobprofile/job/2512/software-developers',
                     'https://www.onetonline.org/link/summary/15-1252.00',
                     'https://esco.ec.europa.eu/en/classification/occupation?uri=http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1']),
      dict(role_id='ai-research',display_name='AI / Machine Learning Engineer',masco_code=None,
        isco_code=None,onet_soc_code=None,esco_uri=None,
        relationship='No exact verified crosswalk; O*NET research scientist and ESCO intelligent systems designer are related context only',
        review_status='unmapped-exact',regions=['MY','US','GLOBAL'],
        related_onet_soc_code='15-1221.00',
        related_esco_uri='http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8',
        source_urls=['https://www.onetonline.org/link/summary/15-1221.00',
                     'https://esco.ec.europa.eu/en/classification/occupation?uri=http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8'])]
    return dict(schema_version=1,version='',checked_at=now,mappings=mappings,facts=facts,
                sources={'onet':{'status':'official-file-import','version':'31.0'},
                         'esco':{'status':'official-api-snapshot'},
                         'dosm':{'status':'pending'},'world_bank':{'status':'pending'},
                         'bls':{'status':'reviewed-official-table','reference_period':'2025–2035'},
                         'mycol':{'status':'reviewed-official-file','reference_period':'2024/2025'},
                         'masco':{'status':'reviewed-official-page','reference_period':'MASCO 2020'},
                         'ilostat':{'status':'not-integrated'},
                         'onet_v2':{'status':'credentials-not-configured'}})


def _refresh(directory=DATA, knowledge_path=ROOT/'data/knowledge/current.json', client=None,
             now=None, force=False):
    now = now or datetime.now(timezone.utc)
    stamp = now.isoformat()
    directory = Path(directory)
    previous = current(directory) if (directory/'current.json').exists() else None
    state_path = directory/'state.json'
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    if previous and not force and state.get('last_attempt') and now < datetime.fromisoformat(state['last_attempt'])+timedelta(days=14):
        return {'result':'not_due',**state}
    # Keep previous verified facts for an unavailable source. No live request on user assessment.
    knowledge = json.loads(Path(knowledge_path).read_text())
    candidate = seed(stamp,knowledge)
    if previous:
        reviewed = {'TalentCorp MyCOL','BLS Employment Projections','MASCO / DOSM MyJobProfile'}
        present={r['source_name'] for r in previous['facts']}
        candidate['facts'] = [r for r in candidate['facts'] if r['source_name'] not in reviewed or r['source_name'] not in present]
        candidate['facts'] += [r for r in previous['facts'] if r['source_name'] in reviewed]
    status = candidate['sources']
    old_status=state.get('sources',{})
    own_client = client is None
    if own_client: client = httpx.Client(timeout=20,follow_redirects=False)
    for name,url,parser,source in [('dosm',DOSM_URL,lambda r:dosm_rows(r.text,stamp),'DOSM / OpenDOSM'),
                                   ('world_bank',WB_URL,lambda r:world_bank_rows(r.json(),stamp),'World Bank Indicators / modeled ILO estimate')]:
        try:
            response=client.get(url)
            response.raise_for_status()
            rows=parser(response)
            candidate['facts']=[r for r in candidate['facts'] if r['source_name']!=source]+rows
            status[name]={'status':'verified-api','checked_at':stamp,'last_success':stamp,'reference_period':rows[0]['reference_period'],
                          'source_version':rows[0].get('source_version')}
        except (httpx.HTTPError,ValueError,KeyError,TypeError) as exc:
            if previous: candidate['facts'] += [r for r in previous['facts'] if r['source_name']==source]
            status[name]={**old_status.get(name,{}),'status':'cached-after-error' if previous else 'unavailable',
                          'checked_at':stamp,'error':type(exc).__name__}
    if own_client: client.close()
    if not any(r['source_name']=='DOSM / OpenDOSM' for r in candidate['facts']):
        raise ValueError('No verified Malaysia DOSM data; previous snapshot preserved')
    fingerprint=[{k:v for k,v in row.items() if k!='retrieved_at'} for row in candidate['facts']]
    candidate['version']='regional-'+hashlib.sha256(json.dumps(fingerprint,sort_keys=True).encode()).hexdigest()[:16]
    validate(candidate)
    archive=directory/'versions'/(candidate['version']+'.json')
    if not archive.exists(): atomic_json(archive,candidate)
    atomic_json(directory/'current.json',candidate)
    state={'last_attempt':stamp,'next_due':(now+timedelta(days=14)).isoformat(),
           'version':candidate['version'],'sources':status}
    atomic_json(state_path,state)
    return {'result':'verified',**state}


def refresh(directory=DATA, knowledge_path=ROOT/'data/knowledge/current.json', client=None,
            now=None, force=False):
    directory=Path(directory)
    directory.mkdir(parents=True,exist_ok=True)
    with (directory/'.sync.lock').open('a') as handle:
        try: fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: raise RuntimeError('Regional sync already running') from None
        try: return _refresh(directory,knowledge_path,client,now,force)
        finally: fcntl.flock(handle,fcntl.LOCK_UN)


class RegionalStore:
    """Poll the validated public data branch, retaining the last good snapshot."""
    published='https://raw.githubusercontent.com/xieyifeng24/AI-Career-Navigator/career-data/data/regional/current.json'
    def __init__(self, client, path=DATA/'current.json'):
        self.client=client
        self.snapshot=validate(json.loads(Path(path).read_text()))
        self.checked=0
        self.lock=asyncio.Lock()
        self.status='bundled'

    async def get(self):
        if time.monotonic()-self.checked<300 or self.lock.locked(): return self.payload()
        async with self.lock:
            self.checked=time.monotonic()
            try:
                response=await self.client.get(self.published,timeout=3)
                response.raise_for_status()
                if len(response.content)>500_000: raise ValueError('Snapshot too large')
                candidate=validate(response.json())
                if {r['role_id'] for r in candidate['mappings']} != {r['role_id'] for r in self.snapshot['mappings']}:
                    raise ValueError('Mapping coverage changed')
                if datetime.fromisoformat(candidate['checked_at']) >= datetime.fromisoformat(self.snapshot['checked_at']):
                    self.snapshot=candidate
                    self.status='published'
            except (httpx.HTTPError,ValueError,KeyError,TypeError):
                self.status='last_valid'
        return self.payload()

    def payload(self):
        return {'snapshot':self.snapshot,'delivery':self.status}


if __name__ == '__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--force',action='store_true')
    args=parser.parse_args()
    print(json.dumps(refresh(force=args.force),indent=2))
