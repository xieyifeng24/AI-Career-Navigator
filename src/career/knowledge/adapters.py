"""Official channels only. No job-site scraping and no inference calls."""
import csv
import hashlib
import io
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import httpx
from bs4 import BeautifulSoup
from .schema import Occupation, Fact

ONET_PAGE='https://www.onetcenter.org/database.html'
ESCO_API='https://ec.europa.eu/esco/api'
MY_TERMS='https://myfuturejobs.gov.my/wp-content/uploads/2024/03/TermsAndConditions.pdf'

class ManualImportRequired(ValueError): pass

class OfficialHTTP:
    """Conditional GET when supported, bounded payload/time, private disposable raw cache."""
    def __init__(self, cache, client=None):
        self.cache=Path(cache); self.cache.mkdir(parents=True,exist_ok=True)
        self.client=client or httpx.Client(timeout=30,follow_redirects=False,headers={'User-Agent':'AI-Career-Navigator public-data-sync/1.0'})
    def get(self,url):
        host=urlsplit(url).hostname
        if host not in {'www.onetcenter.org','ec.europa.eu','esco.ec.europa.eu'}: raise ValueError('Unapproved download host')
        key=hashlib.sha256(url.encode()).hexdigest(); body=self.cache/(key+'.body'); meta=self.cache/(key+'.json')
        old=json.loads(meta.read_text()) if meta.exists() and body.exists() else {}
        headers={k:v for k,v in [('If-None-Match',old.get('etag')),('If-Modified-Since',old.get('modified'))] if v}
        start=time.monotonic()
        with self.client.stream('GET',url,headers=headers) as response:
            if response.status_code==304 and body.exists(): return body.read_text(encoding='utf-8-sig')
            response.raise_for_status(); content=bytearray()
            for chunk in response.iter_bytes():
                content.extend(chunk)
                if len(content)>40_000_000 or time.monotonic()-start>180: raise ValueError('Download exceeds safe limit')
            text=content.decode('utf-8-sig')
            body.write_text(text,encoding='utf-8')
            meta.write_text(json.dumps({'etag':response.headers.get('etag'),'modified':response.headers.get('last-modified')}))
            return text

def rows(text): return list(csv.DictReader(io.StringIO(text)))

def onet(http, ids, now):
    page=BeautifulSoup(http.get(ONET_PAGE),'html.parser')
    hrefs=[urljoin(ONET_PAGE,a['href']) for a in page.select('a[href]')]
    version=re.search(r'db_(\d+)_(\d+)_csv/occupation_data.csv',' '.join(hrefs))
    if not version: raise ValueError('Official O*NET CSV release not found')
    major,minor=version.groups(); release=major+'.'+minor
    tables=['occupation_data','essential_skills','transferable_skills','abilities','task_statements','job_zones','job_zone_reference','scales_reference']
    urls={name:next((h for h in hrefs if h.endswith('/'+name+'.csv') and f'db_{major}_{minor}_csv/' in h),None) for name in tables}
    if not all(urls.values()): raise ValueError('Official O*NET table missing')
    with ThreadPoolExecutor(max_workers=4) as pool:
        data=dict(zip(tables,pool.map(lambda name: rows(http.get(urls[name])),tables)))
    scales={r['Scale ID']:r for r in data['scales_reference']}
    definitions={r['O*NET-SOC Code']:r for r in data['occupation_data'] if r['O*NET-SOC Code'] in ids}
    result=[]
    for code in ids:
        d=definitions[code]
        def ratings(table):
            out=[]
            for r in data[table]:
                if r['O*NET-SOC Code']!=code or r.get('Recommend Suppress')=='Y': continue
                scale=scales[r['Scale ID']]
                value=float(r['Data Value'])
                if not float(scale['Minimum']) <= value <= float(scale['Maximum']): raise ValueError('Official rating outside declared scale')
                scale_text=f"{r['Scale ID']} · {scale.get('Scale Name','')} · {scale.get('Minimum','?')}–{scale.get('Maximum','?')} (official scale)"
                out.append(Fact(id=r['Element ID']+':'+r['Scale ID'],label=r['Element Name'],value=value,scale=scale_text,date=r.get('Date'),url=urls[table]))
            if not out: raise ValueError(f'Missing {table} for {code}')
            return out
        tasks=[Fact(id=r['Task ID'],label=r['Task'],date=r.get('Date'),url=urls['task_statements']) for r in data['task_statements'] if r['O*NET-SOC Code']==code]
        zones=[r for r in data['job_zones'] if r['O*NET-SOC Code']==code]
        education=[]
        for zone in zones:
            ref=next(r for r in data['job_zone_reference'] if r['Job Zone']==zone['Job Zone'])
            education.append(Fact(id='job-zone:'+zone['Job Zone'],label=ref['Education'],relation='US job-zone context, not an admission requirement',date=zone.get('Date'),url=urls['job_zone_reference']))
        if not tasks or not education: raise ValueError('Incomplete tasks/education')
        result.append(Occupation(source='onet',id=code,title=d['Title'],classification='O*NET-SOC',classification_id=code,geography='US',description=d['Description'],skills=ratings('essential_skills')+ratings('transferable_skills'),abilities=ratings('abilities'),tasks=tasks,education=education,url='https://www.onetonline.org/link/summary/'+code,published_at=None,publication_note='Release publication date not supplied by this CSV channel; individual survey dates retained. Verification time is not publication time.',verified_at=now,version=release,license='O*NET Database · USDOL/ETA · CC BY 4.0. Team Nexus selects records; editorial weights and translations are separate additions, not endorsed by USDOL/ETA.',license_url='https://www.onetcenter.org/license_db.html'))
    return result

def esco(http, mapping, now):
    result=[]
    for uri in mapping.values():
        # The public service rejects selectedVersion=1.2.1 (HTTP 500 at verification).
        # Use the actual default response; do not label it the portal's latest release.
        url=str(httpx.URL(ESCO_API+'/resource/occupation',params={'uri':uri,'language':'en'}))
        d=json.loads(http.get(url))
        if d.get('uri')!=uri or d.get('className')!='Occupation' or d.get('status')=='obsolete': raise ValueError('Invalid/obsolete ESCO occupation')
        links=d['_links']; skills=[]
        for relation in ['hasEssentialSkill','hasOptionalSkill']:
            for r in links.get(relation,[]):
                skills.append(Fact(id=r['uri'],label=r['title'],relation=relation,url=r['uri']))
        if not skills: raise ValueError('ESCO skill relationships missing')
        groups=links.get('broaderIscoGroup',[])
        result.append(Occupation(source='esco',id=uri,title=d['preferredLabel']['en'],classification='ESCO / ISCO-08',classification_id=d.get('code') or (groups[0]['code'] if groups else uri),geography='EU',description=d['description']['en']['literal'],skills=skills,url='https://esco.ec.europa.eu/en/classification/occupation?uri='+uri,published_at=None,publication_note='Public API default dataset; exact release/date not returned. Portal release must not be assumed to be the API release.',verified_at=now,version='api-default-sha256:'+hashlib.sha256(json.dumps(d,sort_keys=True).encode()).hexdigest()[:16],license='This service uses the ESCO classification of the European Commission. Selected English records; contextual mapping and translations are Team Nexus additions.',license_url='https://esco.ec.europa.eu/en/about-esco/faq?page=1'))
    return result

def myfuturejobs(path, now):
    """Operator supplies a publicly referenceable permission/licence, never scraped listings."""
    path=Path(path)
    if not path.exists(): raise ManualImportRequired('No confirmed public API or approved import. Obtain PERKESO/SOCSO reuse permission; website terms restrict republication. '+MY_TERMS)
    d=json.loads(path.read_text())
    permission=d.get('permission',{})
    if permission.get('redistribution_allowed') is not True or not permission.get('reviewed_by') or not permission.get('reviewed_at'):
        raise ValueError('Documented redistribution permission and review are required')
    evidence=permission.get('evidence_url','')
    if urlsplit(evidence).scheme!='https' or urlsplit(evidence).hostname not in {'myfuturejobs.gov.my','www.perkeso.gov.my','www.myfuturejobs.gov.my','perkeso.gov.my'}:
        raise ValueError('An official permission evidence URL is required (or retain private permission and publish an official reference with review)')
    records=[Occupation.model_validate({**r,'verified_at':now}) for r in d['records']]
    if not records or any(r.source!='myfuturejobs' or r.license_url!=evidence for r in records): raise ValueError('Import must contain licensed MYFutureJobs records only')
    if any(r.published_at is None for r in records): raise ValueError('Dated Malaysian records required')
    return records
