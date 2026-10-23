# Nexus submission working drafts — NOT SIGNED / NOT FINAL

Retain the original four PDF templates. Export final approved copies as
`SDC2026_Nexus_Preliminary.pdf`, `SDC2026_Nexus_TechDeclaration.pdf`,
`SDC2026_Nexus_Replit_POU.pdf`, `SDC2026_Nexus_Runpod_POU.pdf`.
No proof PDF has been fabricated or overwritten.

## Preliminary proposal draft

Team Nexus · AI Career Navigator · Domain 1 · 5 members · Xiamen University Malaysia.
Leader XIE YIFENG. Leader email/phone: **leader to supply in final submission**.
SDG focus: proposed 4.4, 8.2 and 8.5; confirm the primary track.

### Problem context (under 250 words)

Working adults in marketing and administration face uncertainty about how AI may
change individual tasks and what they should learn next. Broad replacement claims
and generic course lists do not explain the connection between a person's existing
skills, changing work, and a feasible next step. Our initial focus is the moment a
worker wants to compare improving their current role with exploring an adjacent
one, while retaining limited weekly learning time. We use fictional profiles for
the competition and US occupational sources with explicit geographic limitations;
we do not claim those sources establish Malaysian job demand. The problem framing
follows the Aiversecity Domain 1 brief. We have not yet conducted a user study or
measured employment outcomes.

### Proposed AI solution (under 300 words)

AI Career Navigator connects a short fictional profile to dated public occupational
and AI-research signals. An explainable matching layer exposes skills mentioned,
skills not mentioned, task context and published outlook contributions across a
small set of reference occupations. A RunPod-hosted language model is intended to
interpret the actual profile and retrieved evidence, producing task-level AI
augmentation/automation assessments, two career pathways and a feasible 30-day
learning plan. Structured validation rejects unknown occupations/resources,
invented input quotes and plans exceeding the stated weekly budget. The UI separates
source facts, editorial matching and model hypotheses. Moderate and fast adoption
scenarios expose uncertainty. Role/skill recommendations explain proposed links to
SDGs 4 and 8 and specify practical checks rather than claiming measured impact.
The candidate's live-source matching works; real RunPod inference and its quality
are pending endpoint provisioning. The existing Replit URL currently hosts the
scripted prototype, with Autoscale integration prepared for a verified release.

### Architecture / implementation plan

Vanilla HTML/CSS/JavaScript → Python 3.12 FastAPI → public O*NET/arXiv sources →
transparent matching → RunPod official vLLM/Qwen3-4B-Instruct-2507 → validated report.
No database is required for this scope. Workshop participation and sponsor credit
usage must be confirmed by the team, not inferred from this code.

### Design-thinking and deployment strategy (under 200 words)

The existing interface preserves a small-step intake and user-controlled comparison
of two pathways. Fictional marketing and administration profiles are used to test
comprehension, navigation and constraints without processing real CVs. The next
validation step is team review of five real model runs, comparing occupations,
skills and weekly time budgets. Reviewers will check whether every recommendation
is relevant, cited and feasible, and whether SDG links suggest observable actions.
After those checks, deploy the reviewed commit to the existing Replit project using
Autoscale, retain the prior static deployment for rollback, and verify the public
journey. User interviews and measured learning outcomes remain future work; they
have not been claimed as completed research.

### SDG impact framework — proposed evaluation, not measured social impact

- Targets: UN 4.4 (employment-related skills), 8.2 (productivity through innovation),
  8.5 (decent work). Sources: https://sdgs.un.org/goals/goal4 and
  https://sdgs.un.org/goals/goal8.
- Baseline: the V0.1 implementation provides **0 live model-backed reports** and
  **0 refreshed external trend sources**. This is a verifiable technical baseline,
  not a workforce-population statistic. The official brief expects a real-world
  problem baseline; a published Malaysian baseline still needs research/approval.
- Core KPI: percentage of reviewed recommendations with traceable supporting
  context, percentage of plans within weekly budgets, and percentage of synthetic
  test cases whose changes are reflected in the output. Measure with the live
  evaluation rubric; do not report unrun results.
- Proposed Phase 2 targets: 100% known source/resource links and 100% budget-valid
  plans in the test set; at least 80% of recommendations judged relevant and
  supported by two reviewers. These are proposed acceptance thresholds, not impact
  results or statistically justified forecasts. Team must approve before submission.
- Workshop completion, prior-owned work, employment-related IP conflicts and
  signature/date: **must be completed by team members**. Do not tick automatically.

## Technical & tools declaration draft

1. **Overview:** details and links from README. Live URL is still V0.1, not this AI
   candidate. Update only after verification. No secrets or banking details.
2. **Architecture:** use `docs/ARCHITECTURE.md`. Python 3.12; JS/HTML/CSS; exact Python
   package versions in `requirements.txt`. Main libraries: FastAPI (MIT), Pydantic
   (MIT), HTTPX (BSD-3-Clause), Uvicorn (BSD-3-Clause), Beautiful Soup (MIT),
   python-dotenv (BSD-3-Clause); verify all transitive licences before final signing.
3. **APIs/cloud:** O*NET public pages and arXiv public RSS (actual retrieval);
   RunPod vLLM API (real smoke inference verified; report quality evaluation ongoing); Replit Static (existing actual use),
   Autoscale (planned, not yet released); GitHub hosting/PR/CI. Regions, account
   tiers, credits and GPU price must be recorded from actual accounts.
4. **Models/data:** Qwen3-4B-Instruct-2507, pretrained, Apache-2.0, no training or
   fine-tuning. Model revision cdbee75f17c01a7cc42f958dc650907174af0554; official worker v2.29.0. Record image digest before final signing. O*NET
   occupational information, USDOL/ETA, CC BY 4.0; adaptations are matching/SDG
   interpretations. arXiv titles/abstracts with article links, each article's licence
   remains its own; no full-paper redistribution. UN target definitions; curated
   Microsoft/Google/Python documentation links. Two fictional profiles and clearly
   labelled test fixtures; no real personal data. ESCO inspected but not integrated.
5. **AI-assisted development:** OpenAI Codex (major implementation, testing and docs),
   earlier ChatGPT planning if confirmed by team; Replit Agent originally configured
   the imported starter. The rejected separate MVP was not reused. Record exact
   tool versions/settings if available; do not invent model identity.
6. **Sponsor resources:** owner to confirm whether Replit/RunPod usage uses sponsor
   credits. Account existence is not proof of sponsor use. These services can be
   replaced architecturally but official template requirements still need fulfilment.
7. **Privacy:** fictional inputs are kept in browser/request memory and, for real
   inference, transmitted server-side to RunPod. No profile database/body logs.
   Provider/hosting retention applies. Confirm their policy before public real-user
   operation. No real CVs allowed in competition mode.
8. **Risks:** schema compliance does not prove correctness; source relevance,
   geographic transfer, lexical matching, model bias, cold starts, latency, spend,
   source-format changes and citation entailment need evaluation. Guardrails and
   release blockers are in ARCHITECTURE.md/EVIDENCE.md.
9. **Checklist/declaration:** leave unverified items unchecked. Final licence review,
   genuine proof PDFs, team contact fields, leader signature/date remain outstanding.

## Demo walkthrough (honest about current status)

1. Explain the fictional marketing/administration cohort and evidence limits.
2. Open live trend sources. Show O*NET source dates/projection period and arXiv dates.
3. Load a fictional profile; preview source-based matches. Explain score components
   and gaps. Change skills and repeat; show the resulting difference. This is a
   source-driven heuristic, not model inference.
4. Once RunPod is provisioned, generate a real report. Show model/request evidence,
   actual task quotes, human checks, two scenarios and meaningful SDG links.
5. Compare A/B and a 1h versus 8h budget. Show deliverables and validation steps.
6. Show a failed/unconfigured API state: answers preserved, no silent mock fallback.
7. If showing V0.1, explicitly choose the scripted mode and say it is not AI.

## Genuine proof-of-use capture checklist

- Replit: project identity, exact released commit, deployment type/status, public URL,
  browser journey and date. Redact secrets/private account data.
- RunPod: endpoint/model/image identity, successful request ID and output, timestamp,
  worker execution logs/latency and observed usage. Redact API keys.
- Never use a unit-test fixture, echo response or “configured” health response as
  real model proof. Attach only actual successful evidence after live evaluation.
