"""Fetch public sources. Fixed hosts/IDs, bounded requests; never invent missing data."""
import asyncio
import hashlib
import json
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import httpx
from bs4 import BeautifulSoup

# Deliberately narrow initial cohort: marketing / administration / adjacent analytics.
# Titles, skills, tasks and projections are fetched, not hard-coded recommendations.
ROLE_IDS = ('13-1161.00', '13-1082.00', '13-1111.00', '43-6014.00', '15-2051.00')
RESOURCES = {
    'learn-ai': {'title': 'Microsoft Learn: AI learning hub', 'url': 'https://learn.microsoft.com/en-us/ai/', 'note': 'Free reading modules; paid exams or cloud usage excluded.'},
    'learn-data': {'title': 'Microsoft Learn: Power BI learning', 'url': 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi', 'note': 'Free learning materials; use public sample data, check tool licensing.'},
    'learn-python': {'title': 'Python official tutorial', 'url': 'https://docs.python.org/3/tutorial/', 'note': 'Free documentation; no certificate or employment promise.'},
    'learn-sheets': {'title': 'Google Sheets training and help', 'url': 'https://support.google.com/a/users/answer/9282959', 'note': 'Free help materials; use synthetic spreadsheet data.'},
}
for resource_id,tool in {'learn-ai':'Microsoft Copilot','learn-data':'Power BI','learn-python':'Python','learn-sheets':'Google Sheets'}.items():
    RESOURCES[resource_id]['tool']=tool
SDGS = {
    'sdg4': {'title': 'UN SDG 4, target 4.4', 'url': 'https://sdgs.un.org/goals/goal4', 'date': 'Target framework', 'kind': 'sdg', 'text': 'Relevant technical and vocational skills for employment, decent jobs and entrepreneurship.'},
    'sdg8': {'title': 'UN SDG 8, targets 8.2 and 8.5', 'url': 'https://sdgs.un.org/goals/goal8', 'date': 'Target framework', 'kind': 'sdg', 'text': 'Productivity through upgrading and innovation; productive employment and decent work.'},
}

class SourceUnavailable(Exception):
    pass

def parse_role(html, role_id):
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.select_one('h1 .main')
    skills = [x.get_text(' ', strip=True) for x in soup.select('#EssentialSkills li b, #TransferableSkills li b, #Skills li b')]
    tasks = [x.get_text(' ', strip=True) for x in soup.select('#Tasks li .order-2')][:6]
    trend = soup.select_one('#WagesEmployment')
    text = trend.get_text(' ', strip=True) if trend else ''
    growth = re.search(r'Projected growth\s*\(([^)]+)\)\s*(.*?)\s*Projected job openings', text)
    updated = re.search(r'Updated\s+(\d{4})', soup.get_text(' ', strip=True))
    if not title or not skills or not tasks or not growth:
        raise SourceUnavailable('Occupational source format changed or data is incomplete.')
    return {'id': role_id, 'title': title.get_text(' ', strip=True), 'skills': list(dict.fromkeys(skills))[:12], 'tasks': tasks,
            'growth': growth[2], 'period': growth[1], 'updated': updated[1] if updated else 'Not supplied',
            'url': f'https://www.onetonline.org/link/summary/{role_id}', 'source_id': f'onet:{role_id}'}

def parse_research(xml, relevant_only=False):
    root = ET.fromstring(xml)
    items = []
    for entry in root.findall('./channel/item')[:300]:
        title=' '.join(entry.findtext('title', '').split())
        if relevant_only and not re.search(r'cowork|workplace|office|spreadsheet|business requests|corporate|organizational|financial review|financial evidence',title,re.I):
            continue
        raw = entry.findtext('link', '')
        if not re.fullmatch(r'https?://arxiv.org/abs/[\w./-]+', raw):
            continue
        date=parsedate_to_datetime(entry.findtext('pubDate', '')).date().isoformat()
        items.append({'id': f'ai:{len(items)+1}', 'title': title,
                      'text': BeautifulSoup(entry.findtext('description',''),'html.parser').get_text(' ',strip=True)[:2200],
                      'url': raw.replace('http:', 'https:'), 'date': date,
                      'kind': 'research', 'limitation': 'Preprint; research signal, not proven workplace adoption or job demand.'})
        if len(items)==4: break
    if not items:
        raise SourceUnavailable('No AI research signals returned.')
    return items

class SourceStore:
    def __init__(self, client):
        self.client = client
        self.cached = None
        self.loaded_at = 0
        self.lock = asyncio.Lock()

    async def get(self, refresh=False):
        async with self.lock:
            if self.cached and time.monotonic()-self.loaded_at < (60 if refresh else 3600):
                return self.cached
            roles, warnings = [], []
            for role_id in ROLE_IDS:
                try:
                    response = await self.client.get(f'https://www.onetonline.org/link/summary/{role_id}', timeout=15)
                    response.raise_for_status()
                    if len(response.content) > 2_000_000:
                        raise SourceUnavailable('Source too large')
                    roles.append(parse_role(response.text, role_id))
                except (httpx.HTTPError, SourceUnavailable):
                    warnings.append(f'O*NET {role_id} unavailable; omitted from matching.')
            if len(roles) < 2:
                raise SourceUnavailable('Fewer than two verified occupational sources are available. Retry later.')
            research = []
            try:
                response = await self.client.get('https://rss.arxiv.org/rss/cs.AI', timeout=15)
                response.raise_for_status()
                if len(response.content)>3_000_000: raise SourceUnavailable('Research feed too large')
                research = parse_research(response.text,relevant_only=True)
            except (httpx.HTTPError, SourceUnavailable, ET.ParseError, ValueError, TypeError):
                warnings.append('AI research feed unavailable. AI-trend claims cannot be generated until it returns.')
            sources = {f'onet:{r["id"]}': {'title':r['title'], 'url':r['url'], 'date':f"Updated {r['updated']}; projection {r['period']}", 'kind':'occupation', 'text': f"Skills: {', '.join(r['skills'])}. Tasks: {' '.join(r['tasks'])} US projected growth: {r['growth']}."} for r in roles}
            sources.update({r['id']:r for r in research})
            sources.update(SDGS)
            sources.update({key:{**value,'kind':'learning','date':'Access checked separately; living documentation','text':value['note']} for key,value in RESOURCES.items()})
            version = hashlib.sha256(json.dumps({'roles':roles,'research':research},sort_keys=True).encode()).hexdigest()[:16]
            self.cached = {'roles':roles,'research':research,'sources':sources,'warnings':warnings, 'version':version,
                           'retrieved_at':datetime.now(timezone.utc).isoformat(), 'geography':'United States. Not a forecast for Malaysia.',
                           'attribution':'Adapted from O*NET OnLine / O*NET Database, USDOL/ETA, CC BY 4.0. Matching and SDG interpretations are Team Nexus additions.'}
            self.loaded_at=time.monotonic()
            return self.cached
