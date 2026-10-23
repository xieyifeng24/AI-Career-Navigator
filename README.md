# AI Career Navigator

**Your Skills. Your Future. Your Choice.** Team Nexus · SDC Hackathon 2026 · Domain 1.

AI Career Navigator helps people explore career directions, understand their reported strengths and learning needs, and compare practical next steps in an AI-changing workplace. It is an **evidence-informed exploration tool**, not a validated aptitude test, employment probability, or forecast of jobs lost to AI. The competition demo accepts fictional profiles only.

## Current product and source of truth

The [public app](https://ai-career-navigator-xyf20070924.replit.app/) runs in the [existing Replit project](https://replit.com/@xyf20070924/AI-Career-Navigator). The current recovery base is GitHub commit 63a3fbb on [codex/unified-career-results](https://github.com/xieyifeng24/AI-Career-Navigator/tree/codex/unified-career-results), under [Draft PR #11](https://github.com/xieyifeng24/AI-Career-Navigator/pull/11). PR #11 is stacked on [Draft PR #10](https://github.com/xieyifeng24/AI-Career-Navigator/pull/10). GitHub main is still the original submission scaffold (5bdb965); it does **not** contain this product application.

On 23 October 2026, the Replit workspace was on release/unified-results-20261022 at 5d26943, two commits after 63a3fbb. The only file difference from the GitHub product commit is Replit's .replit runtime configuration. The live release is b1677f91; five public assets, including the result adapter and bundled knowledge snapshot, matched 63a3fbb byte for byte. Replit's publish view does not disclose a complete Git commit for that release, so the exact deployment commit remains unproven. See [Phase 1 version recovery](docs/VERSION_RECOVERY_PHASE1.md) for evidence, backups, and remaining gates.

The current main journey is introduction → four-step background choices → 12 seven-level questions (4 common + 8 selected direction) → local report → career map, skill tree, What If, roadmap, SDG view, and JSON/print export. English, Simplified Chinese, and Malay are supported in the assessment flow. The V3 answers are retained as **unverified self-report**; they do not currently change the 24-career ranking. The ranking comes from the earlier deterministic background-choice engine, with raw rule points rather than percentages. What If recalculates supported background choices through that same engine. More study time changes the study plan, not mastered skills or career fit.

The bundled [knowledge snapshot](data/knowledge/current.json) contains five O*NET and five ESCO occupation records. In the current default flow, reviewed mappings attach selected official records to three of the 24 career entries **for context only**. Those records do not yet affect the default career score or calculated skill gap. MYFutureJobs has no approved imported dataset (zero records); its site is an external resource, not a live market feed. AI exposure and measured skill readiness are marked unavailable. The older source-based matching endpoint and local report engine remain in the repository for careful reuse during the next integration phase. [Knowledge source status](docs/CAREER_KNOWLEDGE.md) describes source geography, licences, update code, and scheduling limits.

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

The current recovery baseline passed 61 Python and 132 JavaScript tests on 23 October 2026. To compare a reviewed checkout with a public test or production URL, run the source check below. It fetches only five allowlisted public files and reports their SHA-256 matches. Matching files support provenance, but they do not prove the complete deployment Git SHA.

~~~sh
python scripts/verify_live_assets.py --url https://example.replit.app
~~~

## Repository and release flow

- prototype/ contains the browser UI, questionnaire, deterministic scoring, result views, and legacy routes. prototype/combined/ is the default integrated assessment path.
- src/career/ contains the FastAPI server, older source-based matching, protected optional RunPod inference, and the knowledge snapshot reader. scripts/replit_start.sh starts the server on port 8000.
- data/knowledge/ stores the versioned O*NET and ESCO snapshot and per-source sync state. The update workflow is coded, but GitHub's scheduled workflow is not active while it remains outside the default branch.
- src/main.py, src/utils.py, runpod/handler.py, submission/, and the original template files remain for SDC submission requirements. src/main.py is **not** the web entry point.

Work on short-lived branches, run tests, and review a PR before advancing the product baseline. Keep a Replit backup branch and prior release history. For each future publication, record the reviewed Git commit, any Replit-only config difference, release ID, and public asset comparison in a release record. Do not merge open PRs wholesale or republish simply because a branch is newer. See [team workflow](docs/TEAM_WORKFLOW.md) and [deployment guide](docs/DEPLOYMENT.md).

## Evidence limits and next work

The priority is to connect verified occupation skills and tasks to at least one complete default-flow matching and gap calculation, then extend the reviewed mapping. Keep self-report, official facts, editorial rules, and hypothetical What If inputs distinct. Do not infer Malaysian demand from US or EU data, or label a rule score as an AI replacement probability. The exact live deployment commit needs an explicit build/version marker in a later reviewed release. The [Phase 1 audit](docs/VERSION_RECOVERY_PHASE1.md) records what has been verified and what remains open.

Project code is licensed under [Apache 2.0](LICENSE); third-party data retains its own attribution and licence terms.
