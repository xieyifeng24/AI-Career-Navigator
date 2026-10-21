# Current delivery result — production accepted

See RELEASE.md and evidence/production-acceptance.json. The existing Replit domain
now runs Autoscale with real RunPod inference. The production browser journey
passed, including all report pages, path switch and action plan. Basic checks:
23 Python / 8 Node passed. Further paid evaluation stopped after acceptance.

The earlier audit/evaluation record below is historical; its pending-release
statements have been superseded by the accepted release above.

# Verification evidence — 21 October 2026

## Actual state

| Boundary | Evidence | Status |
|---|---|---|
| Domain requirements | User-supplied Domain 1.pdf pp.4–8 and original submission PDFs reviewed | Complete audit |
| Original Replit | Existing public Static deployment; source diff vs 7db7c84 only `.replit` | Canonical UI reconciled |
| Backend + UI | Local FastAPI candidate at port 8000; four-step intake, consent, error/edit flow manually exercised in Chrome | Verified |
| Public sources | Five O*NET pages + four arXiv entries; real retrieval record in `evidence/source-fetch.json` | Live-tested |
| Source-based matching | Administrative example returns Project Management Specialists first; component/gap/source display visible | Live-tested; lexical heuristic, no AI |
| Offline checks | 22 Python tests, 8 Node tests, JS syntax, `pip check`, `.replit` TOML parse, `git diff --check` | Passed before live integration |
| RunPod endpoint | cckbk8134lpxf8, Qwen3-4B-Instruct-2507, worker v2.29.0, 24GB GPU, max 1 worker | Provisioned by owner; candidate config saved |
| Server credential | Owner-approved endpoint-only read/write API key, GraphQL disabled, saved in ignored `.env` and existing Replit Secrets | Configured |
| Real inference | Real structured smoke request `chatcmpl-a71573c2671223a6`, HTTP 200, JSON status ready, 31 tokens, 117.6s including cold start | Smoke passed; full report evaluation in progress |
| Production release | Existing URL still serves the previous scripted V0.1 | Candidate not published |

Real model results must be recorded here only after they succeed. Unit-test fixtures
are never evidence of model quality. No proof-of-use PDF was fabricated or overwritten.

## Offline checks

Run commands in README. Tests cover input/consent/contact/budget bounds, changing
occupation/skills changing source-based matching and prompts, changed source outlook
changing scores, hour-budget rejection, schema/citation/quote/role/resource validation,
upstream failure/timeout, no model fallback, credential gate, safe error responses,
explicit asset serving and escaped report rendering. The successful HTTP tests use
clearly labelled synthetic fixtures. They do not prove that a real model personalises
well; real evaluation must compare output relevance and feasibility.

Environment: Python 3.12 virtual environment `.venv312`, locked dependency versions,
Node 24. Original Python 3.14 environment was not used for verification. Latest
Starlette emits a deprecation notice for its HTTPX TestClient; tests pass and the
runtime API uses HTTPX normally. This is a test-client migration item, not a model
integration result.

## Browser evidence

- `evidence/setup-required.png`: truthful unconfigured-AI error and preserved answers.
- `evidence/source-matching.png`: actual administrative profile source matching.
- `evidence/runpod-smoke.json`: actual structured GPU response metadata.
- `evidence/runpod-gpu-log.png`: cropped GPU execution log; no API key or account balance.
- Full career-report screenshots/request IDs: evaluation in progress.

Browser checks already performed: fictional marketing intake, all four steps,
required consent blocks submit, missing inference returns an explicit error without
mock substitution, edit returns to preserved input, real source radar loads dated
outlooks, administrative source matching displays explained results. The original
responsive layout was preserved; fresh mobile verification remains to be recorded.

## Live evaluation and release gate

Use `scripts/runpod_smoke.py` for a short real structured-response check, then
`--report` for full validation. Use `scripts/live_check.py --run` for marketing,
administration, changed skills, 1-hour and 8-hour profiles. Raw synthetic output stays
under ignored `.cache/live-evaluation`; publish only reviewed, redacted evidence.

For every live case record: model revision, worker/image version, request ID,
source version, latency, token counts, structural result, manually reviewed task
relevance/gaps/hours/source support, and observed usage. Readiness requires real
inference success and human review, not just a ready endpoint or green unit tests.

Owner approved a maximum **US$2** for these tests. A GPU request may remain queued
or execute after the browser/client stops waiting. Track provider usage and do not
raise worker count or GPU tier to solve cold starts without a justified review.

Do not publish the candidate over the working Replit demo until the release gates
in `DEPLOYMENT.md` pass. The two original POU PDFs still say EXAMPLE ONLY.
