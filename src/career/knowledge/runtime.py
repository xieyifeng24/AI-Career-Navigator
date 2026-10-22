"""Read published public snapshot; no refresh in questionnaire/What-if calculation."""
import asyncio
import time
from pathlib import Path
from .schema import Snapshot

PUBLISHED='https://raw.githubusercontent.com/xieyifeng24/AI-Career-Navigator/career-data/data/knowledge/current.json'
class KnowledgeStore:
    def __init__(self,client,path):
        self.client=client; self.path=Path(path); self.checked=0; self.busy=asyncio.Lock()
        self.current=Snapshot.model_validate_json(self.path.read_text()).model_dump(mode='json')
        self.status='bundled'; self.error=None
    async def get(self):
        if time.monotonic()-self.checked<300 or self.busy.locked(): return self.payload()
        async with self.busy:
            self.checked=time.monotonic()
            try:
                async with self.client.stream('GET',PUBLISHED,timeout=3) as response:
                    response.raise_for_status(); body=bytearray()
                    async for chunk in response.aiter_bytes():
                        body.extend(chunk)
                        if len(body)>3_000_000: raise ValueError('Snapshot too large')
                candidate=Snapshot.model_validate_json(body)
                if not set(self.current['links']).issubset(candidate.links): raise ValueError('Incomplete published coverage')
                existing={r['source']+':'+r['id'] for r in self.current['records']}
                incoming={r.source+':'+r.id for r in candidate.records}
                if not existing.issubset(incoming): raise ValueError('Published snapshot drops verified records')
                # Remote rollback is an operator action, never an automatic stale overwrite.
                if candidate.verified_at >= Snapshot.model_validate(self.current).verified_at:
                    self.current=candidate.model_dump(mode='json'); self.status='published';self.error=None
            except Exception:
                self.status='last_valid';self.error='Published snapshot unavailable or invalid; retained validated data.'
        return self.payload()
    def payload(self): return {'snapshot':self.current,'delivery':self.status,'warning':self.error}
