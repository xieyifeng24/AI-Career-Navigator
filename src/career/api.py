import asyncio
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from .models import Profile
from .sources import SourceStore, SourceUnavailable
from .matching import rank_roles
from .inference import RunPod, InferenceError
from .access import AccessPolicy, COOKIE, SESSION_SECONDS, check_origin, is_local

ROOT=Path(__file__).resolve().parents[2]
load_dotenv(ROOT/'.env')

@asynccontextmanager
async def lifespan(app):
    async with httpx.AsyncClient(follow_redirects=False, headers={'User-Agent':'AI-Career-Navigator/0.2 educational research'}) as client:
        app.state.sources=SourceStore(client)
        app.state.inference=RunPod(client)
        app.state.busy=False
        app.state.access=AccessPolicy(os.getenv('LIMIT_STATE_DIR', str(ROOT/'.cache/runtime')))
        app.state.last_inference=None
        app.state.jobs={}
        app.state.tasks=set()
        yield
        for task in app.state.tasks: task.cancel()

def begin_analysis(request):
    owner=app.state.access.require(request,mutating=True)
    if not app.state.inference.configured:
        raise HTTPException(503,'Real AI is not connected yet. Configure RunPod; no mock analysis will be substituted.')
    if app.state.busy or app.state.tasks:
        raise HTTPException(429,'An analysis is already running. Please wait a few minutes.',headers={'Retry-After':'15'})
    # Use the ASGI peer address, never a caller-supplied X-Forwarded-For value.
    app.state.access.reserve(request.client.host if request.client else 'unknown',owner)
    app.state.busy=True
    return owner

app=FastAPI(title='AI Career Navigator',version='0.2.0',lifespan=lifespan,docs_url=None,redoc_url=None,openapi_url=None)

@app.middleware('http')
async def guard(request, call_next):
    # Bounded body even for chunked requests; never log or persist the profile.
    if request.method=='POST':
        body=b''
        async for chunk in request.stream():
            body+=chunk
            if len(body)>18000: return JSONResponse({'detail':'Request too large.'},status_code=413)
        request._body=body
    response=await call_next(request)
    response.headers['Cache-Control']='no-store'
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='no-referrer'
    response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
    return response

@app.exception_handler(RequestValidationError)
async def invalid_profile(request, exc):
    # FastAPI's default response can echo user input; return only field names.
    return JSONResponse({'detail':'Use a complete fictional profile, 1–40 hours per week, and confirm synthetic data.',
                         'fields':list({str(e['loc'][-1]) for e in exc.errors()})},status_code=422)

@app.get('/api/health')
async def health():
    configured=app.state.inference.configured
    return {'status':'ok','inference_configured':configured,'inference_verified':bool(app.state.last_inference),
            'last_successful_inference_at':app.state.last_inference,
            'model':app.state.inference.model,'mode':'real-ai' if configured else 'setup-required',
            'note':'Configuration does not prove inference health. A successful report is required.'}

@app.get('/api/radar')
async def radar(refresh: bool=False):
    try: return await app.state.sources.get(refresh=refresh)
    except SourceUnavailable as exc: raise HTTPException(503,str(exc)) from exc

@app.get('/api/session')
async def session(request: Request):
    host=request.headers.get('host','')
    token=request.cookies.get(COOKIE,'')
    if not app.state.access.valid_session(token): token=app.state.access.new_session()
    response=JSONResponse({'csrf_token':app.state.access.csrf(token),'note':'Anonymous session; no access code required.'})
    response.set_cookie(COOKIE,token,max_age=SESSION_SECONDS,httponly=True,secure=not is_local(host),samesite='strict',path='/')
    return response

@app.post('/api/analyze')
async def analyze(profile: Profile, request: Request):
    begin_analysis(request)
    return await generate_analysis(profile)

async def generate_analysis(profile):
    provider=app.state.inference
    try:
        async with asyncio.timeout(420):
            snapshot=await app.state.sources.get()
            if not snapshot['research']:
                raise SourceUnavailable('AI research signals are unavailable. Retry when the feed returns; no unsourced AI trend analysis was generated.')
            ranked=rank_roles(profile,snapshot['roles'])
            report,meta=await provider.analyze(profile,snapshot,ranked)
            app.state.last_inference=datetime.now(timezone.utc).isoformat()
            return {'mode':'real-ai','analysis':report.model_dump(),'ranking':ranked,'evidence':snapshot,
                    'inference':meta,'report_id':str(uuid.uuid4()),'generated_at':datetime.now(timezone.utc).isoformat(),
                    'limitations':['Model inferences are hypotheses, not verified competence or hiring advice.',
                                   'Citations identify context; semantic support requires human review.',
                                   'US occupational data does not establish Malaysian demand.',
                                   'Matching is an English lexical heuristic over five reference occupations, not a calibrated suitability probability.']}
    except (SourceUnavailable, InferenceError) as exc: raise HTTPException(503,str(exc)) from exc
    except TimeoutError as exc: raise HTTPException(504,'Analysis exceeded the time limit. Retry later.') from exc
    finally: app.state.busy=False

@app.post('/api/analyses',status_code=202)
async def start_analysis(profile: Profile,request: Request):
    owner=begin_analysis(request)
    # Results are ephemeral and private to the submitting anonymous session.
    app.state.jobs={k:v for k,v in app.state.jobs.items() if time.monotonic()-v['created']<1800}
    job_id=str(uuid.uuid4())
    job={'created':time.monotonic(),'status':'running','owner':owner}
    app.state.jobs[job_id]=job
    async def run():
        try: job.update(status='complete',result=await generate_analysis(profile))
        except HTTPException as exc: job.update(status='error',detail=exc.detail)
        except Exception: job.update(status='error',detail='Analysis could not complete. Your answers are preserved; please retry.')
    task=asyncio.create_task(run());app.state.tasks.add(task)
    task.add_done_callback(app.state.tasks.discard)
    return {'job_id':job_id,'status':'running'}

@app.get('/api/analyses/{job_id}')
async def analysis_status(job_id: str,request: Request):
    owner=app.state.access.require(request)
    job=app.state.jobs.get(job_id)
    if not job or job['owner']!=owner or time.monotonic()-job['created']>=1800:
        raise HTTPException(404,'This analysis is unavailable or expired. Please submit again.')
    return {k:v for k,v in job.items() if k not in {'created','owner'}}

@app.post('/api/match')
async def match(profile: Profile):
    """A useful non-LLM feature; never presented as AI inference."""
    try:
        snapshot=await app.state.sources.get()
        return {'mode':'source-matching','ranking':rank_roles(profile,snapshot['roles']), 'evidence':snapshot,
                'note':'Source-based lexical matching only. No AI model was called.'}
    except SourceUnavailable as exc: raise HTTPException(503,str(exc)) from exc

@app.get('/')
async def index(): return FileResponse(ROOT/'prototype/index.html')

@app.get('/{filename}')
async def asset(filename: str):
    # Serve only explicit frontend assets, never repository files, secrets or tests.
    if filename not in {'app.js','data.js','logic.js','live.js','styles.css'}: raise HTTPException(404)
    return FileResponse(ROOT/'prototype'/filename)
