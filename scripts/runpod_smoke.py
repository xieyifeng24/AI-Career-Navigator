"""Explicit real-inference diagnostic. Never run by CI; consumes GPU time.

--report exercises the full contract and stores only synthetic evaluation output
under ignored .cache. Default mode is a short structured model smoke test.
"""
import argparse
import asyncio
import json
import os
from pathlib import Path
import sys
import time
import httpx
from dotenv import load_dotenv

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from src.career.sources import SourceStore
from src.career.models import Profile, Analysis
from src.career.matching import rank_roles
from src.career.inference import make_messages, validate_analysis, output_schema, normalize_generation
from scripts.live_check import BASE

async def run(full):
    load_dotenv()
    key=os.getenv('RUNPOD_API_KEY','');endpoint=os.getenv('RUNPOD_ENDPOINT_ID','')
    model=os.getenv('RUNPOD_MODEL','Qwen/Qwen3-4B-Instruct-2507')
    if not key or not endpoint: raise SystemExit('RunPod credentials missing. No requests sent.')
    async with httpx.AsyncClient(timeout=240) as client:
        if full:
            s=await SourceStore(client).get();p=Profile(**BASE)
            payload={'model':model,'messages':make_messages(p,s,rank_roles(p,s['roles'])),'temperature':0.2,'max_tokens':6500,
                     'response_format':{'type':'json_schema','json_schema':{'name':'career_analysis','strict':True,'schema':output_schema(p,s)}}}
        else:
            payload={'model':model,'messages':[{'role':'user','content':'Return a JSON object with the key status and the value ready.'}],
                     'temperature':0,'max_tokens':40,'response_format':{'type':'json_object'}}
        started=time.monotonic()
        response=await client.post(f'https://api.runpod.ai/v2/{endpoint}/openai/v1/chat/completions',headers={'Authorization':f'Bearer {key}'},json=payload)
        print('http_status',response.status_code,'seconds',round(time.monotonic()-started,2))
        out=Path('.cache/live-evaluation');out.mkdir(parents=True,exist_ok=True)
        # Response may contain provider diagnostics; inspect locally, never publish raw files.
        (out/('full-raw.json' if full else 'smoke-raw.json')).write_text(response.text)
        response.raise_for_status();body=response.json();choice=body['choices'][0]
        print(json.dumps({'id':body.get('id'),'model':body.get('model'),'finish_reason':choice.get('finish_reason'),'usage':body.get('usage')},indent=2))
        if full:
            if choice.get('finish_reason')!='stop': raise SystemExit('Generation incomplete.')
            validate_analysis(normalize_generation(json.loads(choice['message']['content'])),p,s)
            (out/'full-sources.json').write_text(json.dumps(s))
            print('Full structured validation passed. Semantic review still required.')
        else:
            print('structured_smoke',json.loads(choice['message']['content'])=={'status':'ready'})

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--report',action='store_true')
    args=parser.parse_args();asyncio.run(run(args.report))
