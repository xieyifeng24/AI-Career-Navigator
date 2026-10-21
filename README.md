# AI Career Navigator

**Your Skills. Your Future. Your Choice.** Team Nexus · SDC Hackathon 2026 · Domain 1.

A career exploration application for fictional marketing/administration profiles and
adjacent analytical roles. It combines current public occupational sources,
explainable matching, and a server-side RunPod inference integration.

**Status (21 October 2026):** published to the existing Replit project using
Autoscale and real RunPod inference. A production Chrome journey passed: fictional
profile → real GPU report → both paths → four-week plan. No mock fallback.
[Open the app](https://ai-career-navigator-xyf20070924.replit.app/).
No team access code is required in the updated candidate. Anonymous sessions and
server-side quotas protect inference. Allow several minutes for GPU cold start.
See [release evidence](docs/RELEASE.md) and [known limitations](docs/KNOWN_ISSUES.md).

## Team information

| Field | Value |
|---|---|
| Team | Nexus, 5 members |
| Domain | 1 — The Aiversecity Future-Ready Workforce Domain |
| SDG focus | 4.4 (employment-related skills), 8.2 (productivity), 8.5 (decent work); team must confirm the final submission track |
| Leader | XIE YIFENG |
| University | Xiamen University Malaysia |

| Member | Responsibility |
|---|---|
| XIE YIFENG | Product lead, strategy, final submission approval |
| YANG XUHUI | Backend and integration |
| CHEN QIANYU | Frontend and UX |
| LAI HAILU | AI engineering and evaluation |
| ZHANG XINAO | Research, source verification and QA |

## Links

- [Canonical GitHub repository](https://github.com/xieyifeng24/AI-Career-Navigator)
- [Existing Replit project](https://replit.com/@xyf20070924/AI-Career-Navigator)
- [Public V0.1 scripted demo](https://ai-career-navigator-xyf20070924.replit.app/)
- [Original prototype PR #2](https://github.com/xieyifeng24/AI-Career-Navigator/pull/2) — not merged blindly.
- [Official submission template](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template)
- [Official submission document folder](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef)
- RunPod endpoint, demo video and slides: **pending**.

## Problem and solution

Workers need to connect changing tasks to specific learning choices. Whole-job
replacement probabilities obscure uncertainty. Our initial scope is a small,
explainable exploration of five reference occupations rather than a universal
career adviser. Users stay in control; the application does not make hiring decisions.

The working candidate supports:

1. A four-step fictional profile: background, experience, tasks, skills, AI use,
   concerns, goal, weekly hours and constraints.
2. An updatable source radar: five O*NET occupational pages (including US employment
   projections) and four recent arXiv cs.AI research entries, with source dates,
   retrieval time and content version. Public-source failures are visible.
3. Source-based role ranking and skill gaps, usable **without an AI model**. Scores
   expose all components: 70 points skill overlap, 20 task context, 10 published
   growth category. These weights are an editorial heuristic, not validated fit.
4. A real RunPod API path for structured capability/task analysis, two career paths,
   two adoption scenarios, SDG links and four weeks covering days 1–30. **Successful
   model generation and semantic quality remain to be verified after provisioning.**
5. A separate, explicitly labelled V0.1 scripted mode. It is never an API-failure fallback.

## Run locally

Use Python **3.12** and Node **24** for checks. No frontend dependency installation.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8000 --workers 1
```

Open http://127.0.0.1:8000. With blank secrets, real AI correctly reports setup
required; live sources, source matching and explicitly selected scripted demos work.

To enable real inference, follow [RunPod setup](runpod/README.md), configure the
server-only `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` and `RUNPOD_MODEL`, and restart.
Never put keys in JavaScript, commits or screenshots. Users do not enter a password.
See [anonymous access and limits](docs/ACCESS_CONTROL.md).

In the current maintainer workspace the tested virtual environment is `.venv312`:
`.venv312/bin/python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8000`.

## Tests and actual evidence

```bash
python -m unittest discover tests -v
node --check prototype/app.js
node --check prototype/live.js
node --test prototype/*.test.mjs
python -m pip check
```

CI runs these offline Python/JavaScript tests on PRs to `main`. It never makes paid
inference calls. Fixtures under `tests/` are test data, not model evidence.

After provisioning, explicitly run the five-case live evaluation (incurs GPU use):

```bash
python scripts/live_check.py --run
```

Reports are written to ignored `.cache/live-evaluation`. Review task relevance,
changed skill gaps, time budgets, citations and SDG meaning manually. Schema tests
cannot establish semantic quality. See [test/release evidence](docs/EVIDENCE.md).

## Architecture and project structure

```text
Browser (fictional profile, explicit consent)
  → Replit FastAPI backend
    → O*NET + arXiv (fixed public queries; hourly in-memory snapshot)
    → deterministic, explained role matching
    → RunPod vLLM / Qwen3-4B-Instruct-2507 (pending provisioning)
    → schema, citation, quote and time-budget validation → report
```

- `prototype/`: preserved visual design and explicit scripted examples, plus live UI.
- `src/career/`: API, contracts, public-source retrieval, matching, RunPod adapter.
- `src/main.py`, `src/utils.py`: retained official starter; not the app entry point.
- `runpod/handler.py`: retained official echo example, **not deployed or counted as AI**.
- `runpod/README.md`: official vLLM worker setup and verification instructions.
- `scripts/live_check.py`: explicit live evaluation; never run by CI.
- `tests/`: contract, business-rule and failure tests.
- `submission/`: original four PDFs retained. The proof PDFs say EXAMPLE ONLY.
- `docs/`: manifesto, team workflow, architecture, requirement audit, evidence,
  deployment runbook, technical declaration and proposal drafts.

## How We Use Replit (Required)

The existing project currently publishes the original static V0.1. The new `.replit`
configuration prepares a single-worker FastAPI **Autoscale** candidate with port
8000 and a locked dependency build. It has **not** replaced production. Follow
[release and rollback instructions](docs/DEPLOYMENT.md) after live inference passes.
The original `submission/SDC2026_TeamName_Replit_POU.pdf` is still an unfilled example.

## How We Use RunPod (Required)

RunPod will run the actual Qwen model on the official vLLM Serverless worker. The
backend securely calls its OpenAI-compatible API with real profile/source context
and a JSON schema. The owner has provisioned the endpoint and approved a US$2 evaluation budget. No GPU
inference or RunPod proof of use has been claimed yet; the original proof PDF is
still an unfilled example. See [setup](runpod/README.md).

## Data, models and responsible use

- **Competition data is fictional/public only.** No CV upload or real personal data.
  A confirmation is required; contact-like strings are rejected, but automated PII
  detection is incomplete. The team must still enforce the competition rule.
- No profile database or application profile logs. Inputs live in tab/request memory;
  successful submissions go to RunPod. Hosting/provider logs follow their policies.
- O*NET is US occupational data, not Malaysian demand. It does not measure AI replacement.
  ESCO was evaluated and is reachable; O*NET was chosen because it combines skills,
  tasks and employment outlook in the first cohort. See [architecture](docs/ARCHITECTURE.md).
- arXiv entries are preprints: a dated research signal is not validated workplace
  adoption. If evidence is weak, model instructions require uncertainty.
- Model output is labelled inference. Sources and resources are allowlisted;
  roles/skills must come from retrieved evidence. Citation membership is validated,
  but **citation entailment and hallucination risk still require human evaluation**.
- Proposed model: [Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507),
  Apache-2.0, pretrained; no fine-tuning. Actual image digest/model revision pending.
- Adapted O*NET content: USDOL/ETA, [O*NET Database](https://www.onetcenter.org/database.html),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). O*NET® is a USDOL/ETA trademark.
  Matching and SDG interpretations are Team Nexus additions, without endorsement.
- SDGs represent proposed learning/productivity contributions, not measured social impact.

## Submission checklist

See [Domain 1 audit](docs/COMPETITION_REQUIREMENTS.md) and [submission drafts](docs/SUBMISSION_DRAFT.md).

- [x] Official template structure and original PDFs preserved.
- [x] Domain 1 six requirements identified; candidate code and gaps documented.
- [x] Live public-source retrieval and explainable matching implemented.
- [ ] RunPod endpoint, successful real inference and semantic evaluation.
- [ ] Candidate Replit Autoscale release and public end-to-end verification.
- [ ] Genuine RunPod/Replit proof-of-use PDFs with secrets redacted.
- [ ] Final proposal, tech declaration, slide/video links and team approvals.
- [ ] Confirm workshop completion, IP declarations, contact fields and signatures.
- [ ] Export `SDC2026_Nexus_*` PDFs; retain original template PDFs.

The preliminary template lists **25 October 2026** as the deadline. The supplied
Domain 1 rubric is for preliminaries; the final-round rubric has not been supplied.

## License

Project code: [Apache-2.0](LICENSE). Third-party sources retain their own licences.

## What-if simulator (local candidate, not deployed)

After a report, Career paths and Action plan include an interactive schedule and
priority simulator. It reuses the current report and official links without another
AI call or changes to matching scores. Simulator controls support English, Chinese
and Malay; original report content retains its existing language. See
[behaviour, limits and verification](docs/WHAT_IF_SIMULATOR.md).

## Integrated team candidate

`codex/integration-hackathon` combines the existing visual prototype, real AI backend, choice-based trilingual questionnaire, newer career-star-map UI/explorer views and What-if planning. The questionnaire has one optional supplement field. Integration provenance, verification and remaining limitations: [docs/INTEGRATION_REPORT.md](docs/INTEGRATION_REPORT.md). This branch is for review; it has not been deployed.
