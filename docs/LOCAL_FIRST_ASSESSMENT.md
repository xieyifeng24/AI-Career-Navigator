# Local-first assessment — 22 October 2026

Branch: `codex/local-first-assessment`. This changes the existing application, not
its hosting or project identity. No production deployment, remote main merge or
paid inference was performed for this task.

## User story and boundaries

Four-step questionnaire → browser scoring engine → modular report → local What-if.
There is **no analysis API call** on submit, report navigation, language switching
or simulation. The initial `/api/health` request is informational and is not needed
to generate reports. After the static assets load, assessment works without network
access. This is not a service-worker/PWA installation or a promise that a first
visit can load without a web server.

Optional AI is a separate user action with explicit RunPod data-sharing consent.
It calls the existing anonymous session/CSRF/async-job API. Its output is displayed
separately and never replaces the base report, rule scores or scenario results.

## Files and extension points

| File | Responsibility |
| --- | --- |
| `prototype/local/questions.js` | 10 stable semantic items, five anchored levels plus unknown; EN/zh-CN/MS; education options |
| `prototype/local/careers.json` | Five versioned occupational records, paraphrased facts and official URLs, separate editorial targets and practice projects |
| `prototype/local/engine.js` | Pure scoring and structured report composition; no fetch, model or environment dependency |
| `prototype/local/ui.js` | Questionnaire levels, contribution tables, coverage, report adapter and conditional What-if |
| `prototype/local/optional-ai.js` | Ephemeral deduplication, cached completed requests, cooldown, timeout and unchanged backend contract adapter |
| `prototype/app.js` | Main submit runs local engine; localized reports; separate optional AI state/error handling |
| Existing renderer/explorer/CSS files | Reuse the existing report contract and visual system; label rules distinctly from AI; preserve original AI/demo paths |
| `src/career/api.py` | Explicit allowlist for the five public local-module assets only |

The original occupation/tasks/skills/goals/constraints choices and single optional
supplement are retained. New level items cover analysis, communication, planning,
technical practice, AI-output verification, three interests and two work preferences.
The fictional example profiles have explicit example ratings. Blank user drafts
have no inferred or preselected ability levels. Unknown is a valid answer.

Add an item with a stable ID, translated prompts/anchors, kind and step. Add role
requirements as editorial targets using those IDs. The pure engine and contribution
tests make changes reviewable. Bump rule/library versions when changing policy.

## Scoring rules (illustrative, not scientifically validated)

- Four ability dimensions: total weight 60 (15 each).
- Three interests: total weight 25 (25/3 each).
- Two work preferences: total weight 10 (5 each).
- Education-route alignment: weight 5.
- AI collaboration is reported independently; it does not silently add points to
  occupational matching.
- Ability fit = `min(reported level / editorial target, 1) * 100`.
- Interest/preference fit = `(1 - abs(level - target)/4) * 100`.
- Education levels: secondary=1, diploma/vocational=2, completed degree=3.
  Route alignment = `min(level / editorial route target, 1) * 100`. These are team
  planning assumptions, not official educational thresholds, admission rules,
  credential equivalence judgments or proof of eligibility.
- Unknown/malformed values contribute neither zero nor assumed skill: their
  weights are excluded. Coverage is known weight / full weight. Below 50% coverage,
  score is withheld and exploration remains available.
- Otherwise score is the rounded weighted mean over known terms. Ties use stable
  occupation IDs, not UI language. All contributions and targets are inspectable.
- Dimension bars are self-report level normalized by `(level-1)*25`; they are not
  proficiency tests. Interest and preference dimensions are not ability measures.

Ranks cover only this five-role comparison set. They are not calibrated fit
probabilities or a complete search of the job market. Missing self-reports are not
proven weaknesses. The optional supplement is preserved but is not parsed/scored.

## Occupational facts versus system interpretation

Official context was reviewed from these O*NET summaries on the client date
2026-10-22 (US source scope):

- [Market research](https://www.onetonline.org/link/summary/13-1161.00)
- [Project management](https://www.onetonline.org/link/summary/13-1082.00)
- [Management analysis](https://www.onetonline.org/link/summary/13-1111.00)
- [Administrative support](https://www.onetonline.org/link/summary/43-6014.00)
- [Data science](https://www.onetonline.org/link/summary/15-2051.00)

Library summaries are short paraphrases, with provenance, date and CC BY 4.0
attribution. All numerical targets, translated summaries, scores, task-impact
categories, projects and proposed SDG relationships are Team Nexus editorial
content. No official O*NET numerical ability ratings, salary figures, live demand,
replacement probabilities or Malaysian forecasts are invented. Official learning
links and UN SDG definitions remain clickable. Live source retrieval remains
available through the existing explicit source-radar feature and backend routes.

Reports compose role facts, measured self-report terms, strengths/gaps, task
hypotheses, conditional scenarios, projects, resource choices, four weekly steps,
deliverables, validation checks, goals/constraints and limitations. They are not
whole reports hardcoded for every answer combination.

## What-if

The score simulator calls the **same `scoreProfile` function** with an immutable
copy of assumed skill/education levels. It shows every original/conditional score,
changes in ordering, coverage and conditional learning priorities. Assumed levels
are explicitly hypothetical; no earned skill or qualification is claimed.

The existing action-plan pacing simulator remains functional. Hours only repack
existing work and never improve a score. Reset restores baseline assumptions.
Language switches retain conditions and regenerate localized base content locally.

## AI resilience and data handling

- Only the optional AI button can invoke inference; no automatic retry or fallback.
- One in-flight client request, same-payload promise reuse, up to four completed
  responses cached in tab memory and a 60-second per-payload cooldown after completion
  or failure. Attempt keys are bounded. No profiles/tokens stored in localStorage.
- UI wait limit 90 seconds, with abort signal and a friendly independent error panel.
  Aborting the wait may not stop a provider request already accepted by the server.
- Existing backend single concurrency, signed cookies, CSRF/origin checks, persistent
  IP/session/global quotas and upstream timeout remain unchanged.
- 429, timeout, offline and malformed responses never remove the base report. A
  stale AI request cannot overwrite a newly started assessment.
- Legacy text/structured profile contracts are retained; additional assessment and
  education context is passed in the bounded optional context field for AI use.
- Backend RunPod integration, endpoint configuration, Secrets and deployment settings
  are retained. No provider credentials are imported into frontend modules.

## Competition privacy decision

Existing `COMPETITION_REQUIREMENTS.md` traces Domain 1 page 6 to public/open/synthetic
data only and no real CVs. Retain the fictional-data restriction. Confirmation is
at the questionnaire entrance once per assessment, not on every step or report.
Optional external processing requires its own consent; that is a data-sharing
choice rather than a repeated fictional-data popup.

## Verification evidence

45 Node tests and 38 Python tests pass. Node tests cover acceptance A–E, an
independent weighted-score calculation, unknown/low-coverage behavior, unchanged
scores when only hours change, English/Chinese/Malay records and controls, actual
429 request transport, deduplication/cooldown and forced timeout. Python tests retain
legacy AI/security contracts and verify local asset allowlists.

Browser verification used `.cache/local_first_preview.py`, an ignored local test
harness with no RunPod provider or credentials. The optional POST always returns
429; it is never shipped as an application fallback. Observed:

- Chinese and Malay four-step flows produce complete local reports immediately.
- Marketing example ranks market research first (88); administrative example ranks
  administrative support first (94). These are regression examples, not validations
  of career prediction quality.
- Technical assumption 2→5 changes data-science score 68→77 using the same engine;
  original report and other unchanged terms remain intact.
- Optional AI 429 shows a localized error while the four-week plan remains readable.
  A fresh-origin check confirmed the error updates to Malay when switching language.
- No analysis POST before the optional button; server logs only show the initial
  health/assets requests during questionnaire/report/What-if interaction.
- 390px phone width: questionnaire and report `scrollWidth == clientWidth == 390`.
  1440px desktop layout also inspected; viewport override reset afterward.
- `evidence/local-first-what-if.png` records local rule output, not AI inference.

No paid RunPod smoke test was run: its existing code is retained and the change is
specifically tested with inference unavailable. Some extended explorer explanatory
copy still falls back to English as in the existing app; core new questionnaire,
rule explanations, report modules, simulator and optional-AI error are trilingual.

## Run locally

Full app (existing dependencies):

```sh
.venv312/bin/python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8000 --workers 1
```

Core-only preview without dependencies or AI/backend:

```sh
python3 prototype/server.py --port 4173
```

Open the respective localhost URL. The static preview deliberately cannot provide
optional AI or live-source API routes; the complete base assessment still works.
Checks: `node --test prototype/*.test.mjs` and
`.venv312/bin/python -m unittest discover tests -q`.
