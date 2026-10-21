# Domain 1 requirement audit — 21 October 2026

Sources reviewed: user-supplied **Domain 1.pdf**, 8 pages; the official GitHub
submission template and its four PDFs retained in `submission/`. Domain PDF page
numbers below count from its cover. This is a traceable implementation plan, not a
claim that all requirements have already been demonstrated.

| Official requirement | Source | Candidate implementation | Remaining evidence |
|---|---|---|---|
| Profile intake | Domain p.5 | Four steps, validation, editable fictional examples | Actual model journey |
| Updatable AI/job-market signals, source/date, not hardcoded alone | p.5 | Live O*NET occupational projections + arXiv RSS; retrieval time, source dates, content hash, hourly cache and refresh | Observe changed external snapshot over time; review relevance |
| Ranked future roles, explainable match score and gaps | p.5 | `/api/match`, transparent lexical score with exposed components; five reference occupations | Broader cohort/semantic quality evaluation |
| Ordered personalised learning, estimated time, free/low-cost resources | p.5 | Model contract with four weeks, each <= input budget, allowlisted resources | Real RunPod generation and feasibility review |
| Each role/skill linked to SDGs | p.5 | Role/skill SDG links, rationale and proposed measurable contribution in model contract/UI; editorial mappings in source matching | Human review for meaningful mappings |
| Multiple scenarios and estimates | p.5 | Moderate/fast adoption scenarios required in schema; no probabilities | Real output review |
| Public/open/synthetic data only; no real CVs | p.6 | Explicit fictional-profile confirmation, bounded fields/contact filter, no upload | Team must enforce; filter is not complete PII detection |
| Model disclosure, cited recommendations, no invented jobs/courses/statistics | p.6 | Named model; known role/skill/resource IDs, claim citations, quote matching and percentage/URL checks | Citation validity ≠ entailment; semantic review needed |
| Human-centred, no final hiring decisions | p.6 | User-selected paths, uncertainty, no hiring integration | Demo review |
| Replit and RunPod use | Official repo README “Required” sections | Existing static Replit, new Autoscale config, real-model RunPod adapter | Paid endpoint, live inference, deployment and genuine POU |

Domain p.6 says stack choice is free; the repository template separately labels
Replit and RunPod as required. We prepare both, without claiming the Domain PDF
itself mandates those platforms. The supplied PDF does not contain final-round
marking criteria.

Preliminary rubric (pp.7–8): innovation/creativity 30%, problem–solution fit 25%,
feasibility 25%, clarity 20%. The strongest early demo is the **trend signal layer
feeding role matching**, not a polished static report. Preliminary proposals must
explain all six must-haves and show the most important feature working; final
products must include all six. GitHub must be public or accessible to judges and
match the demonstrated code.

Optional (p.6): employer view, automatic re-planning, multilingual support,
progress/badges, fairness checks, aggregated SDG contribution. These are not
separately scored; payments, complete course creation and real recruitment
integrations are out of scope.

Original submission PDFs: proposal deadline 25 October 2026; proposal word limits
250/300/200 for problem/solution/design strategy. Technical declaration requires all
libraries, APIs, cloud platforms, models, datasets, AI development tools and sponsor
resources, plus privacy/limitations and a signed leader declaration. POU files are
examples, not evidence. No eligibility box or signature was filled on the team's behalf.

## Canonical implementation decision

- GitHub `main`: starter/team-workflow baseline at `5bdb965` during audit.
- PR #2 branch: `7db7c84`, full V0.1 UI and scripted scenarios.
- Existing Replit: local `main` at `cc8efba` (“Published your App”), six commits ahead
  of its tracked main. `git diff 7db7c84 --stat` showed only five `.replit` lines;
  `app.js`, `logic.js`, and `runpod/handler.py` had no difference.
- Separate previously generated Replit MVP was not the user's approved product and
  had no verified real model integration. No code was copied from that project.
- Chosen base: PR #2's UI, upgraded on `codex/real-ai-mvp`; no destructive merge,
  force push, or production replacement. Preserve Replit's existing release for rollback.
