# AI Career Navigator

**Your Skills. Your Future. Your Choice.** Team Nexus · SDC Hackathon 2026 · Domain 1.

AI Career Navigator helps people explore career directions, understand their reported strengths and learning needs, and compare practical next steps in an AI-changing workplace. It is an **evidence-informed exploration tool**, not a validated aptitude test, employment probability, or forecast of jobs lost to AI. The competition demo uses fictional profiles; the local-first flow provides privacy and optional AI-sharing notices.

## Current product and source of truth

The [public app](https://ai-career-navigator-xyf20070924.replit.app/) runs in the [existing Replit project](https://replit.com/@xyf20070924/AI-Career-Navigator). GitHub `main` now contains the integrated product; the local `main` may include work that has not yet been pushed or deployed. A production URL alone does not prove its running commit. See [Phase 1 version recovery](docs/VERSION_RECOVERY_PHASE1.md) for the original audit and backups.

The current main journey is introduction → Understand You (one question per page, nine core questions, adaptive follow-ups, optional story) → 12 seven-level questions (4 common + 8 selected direction) → local report → career map, skill tree, What If, roadmap, SDG view, and JSON/print export. English, Simplified Chinese, and Malay are supported. V3 answers are **unverified self-report**. The software direction uses reviewed O*NET and ESCO tasks and skills for exploratory route comparison; other directions retain the earlier bounded behavior. What If keeps hypothetical inputs separate from original answers. More study time changes the study plan, not mastered skills or career fit.

The bundled [knowledge snapshot](data/knowledge/current.json) contains seven O*NET and seven ESCO occupation records. The [Malaysia to Global pilot](docs/MALAYSIA_GLOBAL_PILOT.md) adds separate, attributed Malaysia/US/international evidence for the software direction. DOSM and World Bank data are refreshed from official APIs; reviewed MyCOL, MASCO and BLS records are marked as official-file/page extracts with their actual statistical scope. MYFutureJobs has no approved imported dataset. Optional RunPod interpretation never replaces the deterministic base report.

## V4 evidence engine

The versioned [Understand You questionnaire](prototype/combined/starting-point-bank.json) and unchanged V3 bank feed [one evidence model](prototype/combined/intelligence.js). Software/AI comparisons use separate ordinal evidence dimensions and partial Pareto comparison, with unknown research requirements and explicit ties. Optional AI validates personal evidence and source/action IDs, preserving the base report on failure. Other directions retain bounded source/catalog coverage.

[Six fictional acceptance reports](docs/V4_ACCEPTANCE_REPORTS.md) are reproducible with `node scripts/v4-acceptance.mjs`. See [V4 implementation and limits](docs/CAREER_INTELLIGENCE_V4.md).

## Run locally

Use Python 3.12 and Node.js 20 or newer. No frontend build step is needed.

~~~sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8000 --workers 1
~~~

Open http://127.0.0.1:8000/. The main questionnaire and report work without RunPod credentials. The server-only RunPod path is optional and requires explicit user consent. Never put RUNPOD_API_KEY in browser code, Git, or screenshots. See [RunPod setup](runpod/README.md) and [access controls](docs/ACCESS_CONTROL.md).

~~~sh
.venv/bin/python -m unittest discover tests -q
node --test prototype/*.test.mjs
~~~

To compare a reviewed checkout with a public test or production URL, run the source check below. Matching files support provenance, but they do not prove the complete deployment Git SHA.

~~~sh
python scripts/verify_live_assets.py --url https://example.replit.app
~~~

## Repository and release flow

- prototype/ contains the browser UI, questionnaire, deterministic scoring, result views, and legacy routes. prototype/combined/ is the default integrated assessment path.
- src/career/ contains the FastAPI server, older source-based matching, protected optional RunPod inference, and the knowledge snapshot reader. scripts/replit_start.sh starts the server on port 8000.
- data/knowledge/ stores the versioned O*NET and ESCO snapshot. data/regional/ stores the bounded regional pilot facts, source status and 14-day due ledger. The scheduled workflow's actual execution must be checked in GitHub Actions.
- src/main.py, src/utils.py, runpod/handler.py, submission/, and the original template files remain for SDC submission requirements. src/main.py is **not** the web entry point.

Work on short-lived branches, run tests, and review a PR before advancing the product baseline. Keep a Replit backup branch and prior release history. For each future publication, record the reviewed Git commit, any Replit-only config difference, release ID, and public asset comparison in a release record. Do not merge open PRs wholesale or republish simply because a branch is newer. See [team workflow](docs/TEAM_WORKFLOW.md) and [deployment guide](docs/DEPLOYMENT.md).

## Evidence limits and next work

Extend the reviewed mapping only when an exact classification and legitimate source can be verified. Keep self-report, official facts, editorial rules, and hypothetical What If inputs distinct. Do not infer Malaysian demand from US or EU data, or label a rule score as an AI replacement probability. The exact live deployment commit needs an explicit build/version marker in a later reviewed release.

Project code is licensed under [Apache 2.0](LICENSE); third-party data retains its own attribution and licence terms.
