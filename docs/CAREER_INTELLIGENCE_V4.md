# Career Intelligence V4 · implementation and acceptance

## Contract and boundaries

`starting-point-1` stores Questionnaires A's stable categorical IDs, the four capability states, adaptive follow-ups, and an optional local story. `3.0.0` retains the authoritative V3 IDs, numeric 1–7 answers and independent null/not-applicable state. No legacy option is converted to a scale answer. Each question occupies one screen, with forward/back transitions and reduced-motion support. Language is a view choice; it never changes stored answers.

`career-intelligence-4.0` contains literal evidence, eight personal-context groups, cross-answer claims, route dimensions, source-linked occupational requirements, partial comparison, connection conditions, actions and scenario assumptions. `buildCompatibleReport` attaches this single object to the retained report. Career comparison, map, requirements and export use that adapter; there is no separate new percentage-scoring engine.

## Rules

- V3 1–3 = not endorsed; 4 = mixed/neutral; 5–7 = supported. These are disclosed product interpretation bands, not calibrated psychometric weights. Original values remain available. Null is unknown, never neutral or zero.
- A capability/experience category remains an unverified report, not tested competence. Project experience can coexist with guided execution or little independent repair; the engine flags the distinction rather than averaging it away.
- Software route task anchors join SW01/SW02/SW03/SW04 to reviewed O*NET tasks and ESCO/O*NET skills. SW05/SW06 describe reported implementation/repair separately. Related research anchors use SW03 only as task preference; mathematics and AI principles remain unmeasured. Programming and AI-tool experience do not establish ML research experience.
- Interest, work preference, experience, skill readiness, goals, feasibility and market context stay separate. A partial Pareto comparison uses at least two comparable observed dimensions. Unknown dimensions are excluded and ties remain explicit; priority is provisional, not objective readiness. All verified-readiness values remain unknown without a work test. No unsupported fit percentage is returned.
- Q02/Q08 select concern and action focus, Q09 selects the initial regional context. These do not modify ability evidence. Q05/Q06 affect preparation and verification; Q10/Q11 retain practical context without pretending to measure eligibility or resources.
- `interest-before-artifact`, `artifact-without-repair`, `ai-without-check`, `build-maintain-tension` and `artifact-execution-context` are explicit cross-answer rules. Each claim retains original evidence IDs and corresponding action IDs.

## Same engine, different scenarios

Existing What If controls call the same adapter. An assumed reviewed software sample changes the scenario's implementation/repair/testing evidence states and next experiment. It never alters original interests, answers, actual competence, mathematics, source statistics or employment eligibility. The same scenario object reaches the career map and requirements view. Reset restores the original calculation. Existing visual geometry is retained; requirement connections and transition conditions are source-based comparisons, not proven migration pathways.

The V4 controls also support target route, target market and increased AI reliance. These are explicit scenario priorities: a chosen route changes display/action focus, a market changes regional context, and greater AI reliance changes review tasks. None increases measured ability. A cross-direction adaptive assessment is not implemented. Other nine directions preserve existing bounded coverage rather than inheriting unreviewed software mappings.

## Data and update status

The existing snapshots and adapters are reused, without changing their release dates:

| Source | Current mode | Scope / limit |
|---|---|---|
| DOSM | Official public API; HTTP 200 rechecked this round | Professional occupational group, not software/ML salary |
| O*NET | Reviewed official database snapshot; official occupation page HTTP 200 rechecked | US task/skill facts; 2.0 authenticated API not configured |
| ESCO | Official API; HTTP 200 rechecked for software occupation | European skills taxonomy, not worldwide job demand |
| MyCOL / MASCO | Existing reviewed official file/page extracts | Shortage list and classification respectively; no invented live API |
| BLS | Existing reviewed official table extracts | US statistics, not Malaysian forecasts |
| World Bank | Existing verified API snapshot/adapter | National macro context, not occupation fit |
| ILOSTAT / MYFutureJobs | Not integrated as an approved dataset | No fabricated coverage |

The existing daily GitHub schedule checks a persistent 14-day due ledger. It publishes validated snapshots on the existing data branch and retains previous valid data on failure. This round did not create any branch or change source version dates. Scheduled execution is not claimed merely because YAML exists; inspect the repository's Actions history. Public API checks do not prove O*NET authenticated access.

## Optional AI

Reuse server-only RunPod credentials and endpoint. The request includes canonical V3 semantics, validated Questionnaire A option IDs resolved to server-owned text, bounded deterministic findings and source facts. Free text is excluded unless separately consented. API keys never enter browser payloads. The base report is available before any AI request.

V4 retains four display sections. Three are generated personal/route/action explanations; the market section is a labeled deterministic source summary to prevent unsupported cross-country growth comparisons. Each claim carries claim ID, conclusion, evidence IDs, source IDs, inference type, uncertainty, limitations and recommended action IDs. All IDs are checked against allowed inputs/actions. Inference boundaries are constrained by whether a scenario exists. Incomplete sentences and unsupported generated quantities are rejected. Reference validation is **not proof of semantic entailment**; source interpretation still requires review.

Existing session/CSRF protection, SQLite quotas, single concurrency and owner-scoped 30-minute caching remain. Requests have a bounded 240-second server timeout (245-second browser deadline) to accommodate observed cold starts. No automatic paid retry is performed. Any failure or 429 preserves the deterministic report, with localized feedback. Stale replies cannot replace a changed assessment/scenario.

## Verification

- `node --test prototype/*.test.mjs`: 172 passing tests at this checkpoint.
- Python unit tests: 70 passing tests.
- Actual browser: one-question intake, adaptive follow-ups, language change, all twelve V3 questions, direct report, refresh recovery and scenario-to-map state verified.
- Six complete fictional personas and reports: [acceptance reports](V4_ACCEPTANCE_REPORTS.md), [structured evidence](V4_FICTIONAL_RESULTS.json). Regenerate with `node scripts/v4-acceptance.mjs`.
- Tests cover identical evidence/different goals, independent repair 2→6 sensitivity, contradictions, null answers, scenario isolation, source references, three-language structural consistency, missing source context, AI schema rejection and unconfigured fallback.
- Real RunPod calls verified the configured Qwen model; a cold-start request exceeded the old 120-second deadline. A subsequent structured call completed in 11.8 seconds. A long/invalid response was correctly rejected during validation development. Final production inference status is recorded separately after deployment.

This remains a finite, transparent rule system with optional generated explanations, not a scientifically validated career prediction or an unrestricted reasoning system. Occupational facts appropriately repeat across users; personal evidence and verification tasks differ. No global ranking, replacement probability or confirmed skill is manufactured.
