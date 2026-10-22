"""Explicit live evaluation. Makes paid inference requests only with --run.

Outputs contain synthetic profiles only; human review is still required.
Run from repository root: python scripts/live_check.py --run
"""
import argparse
import json
from pathlib import Path
import sys
import time
import httpx
from dotenv import load_dotenv

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from src.career.inference import validate_analysis
from src.career.models import Profile

BASE={'background':'Fictional marketing specialist','experience':'3 years','tasks':'Write campaign briefs; review survey findings; present recommendations.',
      'skills':'Writing, critical thinking, speaking','aiUse':'Occasional draft summaries','concerns':'Routine content changes',
      'goal':'Improve evidence-led marketing decisions','hours':3,'constraints':'Free materials; keep current fictional role','synthetic':True}
CASES={'marketing':BASE,'admin':BASE|{'background':'Fictional administrative assistant','tasks':'Coordinate meetings; maintain request logs; resolve scheduling exceptions.',
       'skills':'Coordination, time management, active listening','goal':'Explore project coordination','hours':2},
       'skills-change':BASE|{'skills':'Mathematics, programming, systems analysis'},'one-hour':BASE|{'hours':1},'eight-hours':BASE|{'hours':8}}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--run',action='store_true');parser.add_argument('--base-url',default='http://127.0.0.1:8000');parser.add_argument('--case',choices=CASES,default='marketing')
    args=parser.parse_args()
    if not args.run: parser.exit(message='No inference performed. Use --run after approving endpoint costs.\n')
    load_dotenv()
    out=Path('.cache/live-evaluation');out.mkdir(parents=True,exist_ok=True)
    records=[]
    with httpx.Client(timeout=450) as client:
        base=args.base_url.rstrip('/')
        session=client.get(base+'/api/session');session.raise_for_status()
        headers={'Origin':base,'X-CSRF-Token':session.json()['csrf_token']}
        for name,fields in [(args.case,CASES[args.case])]:
            start=time.monotonic()
            response=client.post(base+'/api/analyses',json=fields,headers=headers)
            response.raise_for_status();job_id=response.json()['job_id']
            for _ in range(160):
                time.sleep(3)
                poll=client.get(base+'/api/analyses/'+job_id);poll.raise_for_status();status=poll.json()
                if status['status']=='error': raise RuntimeError(status['detail'])
                if status['status']=='complete':
                    result=status['result'];break
            else: raise RuntimeError('Analysis exceeded the polling deadline.')
            if result.get('mode')!='real-ai': raise RuntimeError('Not a real-inference report')
            validate_analysis(result['analysis'],Profile(**fields),result['evidence'])
            (out/f'{name}.json').write_text(json.dumps(result,indent=2))
            records.append({'case':name,'seconds':round(time.monotonic()-start,2),'inference':result['inference'],'report_id':result['report_id'],
                            'source_version':result['evidence']['version'],'schema':'passed','semantic_review':'PENDING'})
            print(name,'schema passed; semantic review required')
    (out/'evidence.json').write_text(json.dumps(records,indent=2))
    print('Review task relevance, changed gaps, feasible hours, source entailment and SDG meaning before release. Outputs:',out)

if __name__=='__main__': main()
