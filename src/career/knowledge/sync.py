"""CLI synchronizer. Persistent due ledger + atomic versions + process lock."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
import fcntl
import hashlib
import json
import os
from pathlib import Path
import tempfile
from . import adapters
from .schema import Snapshot

ROOT=Path(__file__).resolve().parents[3]
INTERVAL=timedelta(days=14)
ATTRIBUTION=[
 'O*NET Database, USDOL/ETA, CC BY 4.0: https://www.onetcenter.org/license_db.html . Selected records; Team Nexus editorial scoring and translations are additions, not approved or endorsed by USDOL/ETA.',
 'This service uses the ESCO classification of the European Commission. Selected records; Team Nexus contextual links are not official equivalences.',
 'MYFutureJobs: no confirmed public API; no market statistics included without a permission-reviewed import.'
]
def read(path,default): return json.loads(path.read_text()) if path.exists() else default

def atomic(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(dir=path.parent,suffix='.tmp')
    try:
        with os.fdopen(fd,'w') as f:
            json.dump(value,f,ensure_ascii=False,indent=2,allow_nan=False); f.write('\n'); f.flush(); os.fsync(f.fileno())
        os.replace(name,path)
    finally:
        if os.path.exists(name): os.unlink(name)

@contextmanager
def lock(path):
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('a') as handle:
        try: fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: raise RuntimeError('Knowledge sync already running') from None
        try: yield
        finally: fcntl.flock(handle,fcntl.LOCK_UN)

def due(state,now):
    previous=state.get('last_attempt')
    return not previous or now>=datetime.fromisoformat(previous)+INTERVAL

def content_hash(records,links):
    # Verification clock alone must not manufacture a new content version.
    content=[r.model_dump(mode='json',exclude={'verified_at'}) for r in records]
    return hashlib.sha256(json.dumps({'records':content,'links':links},sort_keys=True).encode()).hexdigest()[:16]

def synchronize(directory,cache,now=None,force=False,providers=None):
    now=now or datetime.now(timezone.utc); directory=Path(directory)
    with lock(directory/'.sync.lock'):
        state=read(directory/'state.json',{'sources':{}})
        if not force and not due(state,now): return {'result':'not_due','next_due':state['next_due']}
        old=Snapshot.model_validate(read(directory/'current.json',None)) if (directory/'current.json').exists() else None
        config=read(ROOT/'data/knowledge/catalog.json',{})
        mapping=config['esco']; ids=config.get('onet',list(mapping))
        http=adapters.OfficialHTTP(Path(cache)/'http')
        providers=providers or {'onet':lambda:adapters.onet(http,ids,now),'esco':lambda:adapters.esco(http,mapping,now),'myfuturejobs':lambda:adapters.myfuturejobs(directory/'imports/myfuturejobs.json',now)}
        records=[]; statuses={**state.get('sources',{})}
        for source in ['onet','esco','myfuturejobs']:
            previous=[r for r in (old.records if old else []) if r.source==source]
            status={**statuses.get(source,{}),'checked_at':now.isoformat()}
            try:
                fresh=providers[source]()
                # Validate the complete source before replacing any record from it.
                validated=Snapshot(version='candidate',verified_at=now,records=fresh,links={},attribution=[])
                if any(r.source!=source for r in validated.records): raise ValueError('Mixed source batch')
                expected=set(ids if source=='onet' else mapping.values() if source=='esco' else [r.id for r in fresh])
                if {r.id for r in fresh}!=expected: raise ValueError('Incomplete catalog coverage')
                records.extend(validated.records)
                status.update(status='current',last_success=now.isoformat(),error=None,records=len(fresh),content_changed=content_hash(validated.records,{})!=content_hash(previous,{}))
            except Exception as exc:
                records.extend(previous)
                status.update(status='manual_import_required' if isinstance(exc,adapters.ManualImportRequired) else 'error',error=str(exc)[:700],records=len(previous))
            statuses[source]=status
        http.client.close()
        state.update(last_attempt=now.isoformat(),next_due=(now+INTERVAL).isoformat(),sources=statuses)
        links={code:[key for key in (['onet:'+code]+(['esco:'+mapping[code]] if code in mapping else [])) if any(r.source+':'+r.id==key for r in records)] for code in ids}
        # Manual imports explicitly identify the matching onet classification ID; no fuzzy merge.
        for r in records:
            if r.source=='myfuturejobs' and r.classification=='O*NET-SOC contextual mapping' and r.classification_id in links:
                links[r.classification_id].append(r.source+':'+r.id)
        if not records or (old and not any(s.get('status')=='current' and s.get('checked_at')==now.isoformat() for s in statuses.values())):
            state['publication']='retained_previous_no_valid_candidate';atomic(directory/'state.json',state)
            return state
        version='knowledge-'+now.strftime('%Y%m%dT%H%M%SZ')+'-'+content_hash(records,links)
        candidate=Snapshot(version=version,verified_at=now,records=records,links=links,attribution=ATTRIBUTION)
        payload=candidate.model_dump(mode='json')
        # Archive before publishing. A failed validation/write cannot replace the last good current.
        archive=directory/'versions'/(version+'.json')
        if archive.exists() and read(archive,{})!=payload: raise ValueError('Immutable snapshot version collision')
        if not archive.exists(): atomic(archive,payload)
        atomic(directory/'current.json',payload)
        state.update(publication='verified',version=version,last_publication=now.isoformat())
        atomic(directory/'state.json',state)
        return state

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--directory',default=str(ROOT/'data/knowledge'));parser.add_argument('--cache',default=str(ROOT/'.cache/knowledge'));parser.add_argument('--force',action='store_true')
    args=parser.parse_args(); result=synchronize(args.directory,args.cache,force=args.force)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if result.get('publication')=='retained_previous_no_valid_candidate' or any(s.get('status')=='error' for s in result.get('sources',{}).values()): raise SystemExit(1)
if __name__=='__main__': main()
