# 2026-10-24 urgent questionnaire and analysis correction

Based on main 6d194432ea24cebc48f9cb9c305c89e757bb0349. All work remains on main. Existing constellation, Skill DNA, occupational snapshots and SDG engine/catalog/artwork are preserved.

## Contracts and migration

- Starting Point `starting-point-2`: Q02 concerns and Q09 markets store `{selected, primary}`; primary must be explicitly selected from the selected values. Q04 fields, Q06 experience/outcomes, Q07 barriers, Q08 goals, Q12 interests and Q13 actual AI practices store validated, bounded selections. Exclusive choices replace other choices. Q05 retains one scalar level for each of four rows. Stage and adaptive follow-ups remain scalar. Optional story is Q14, stored separately and not automatically sent to AI.
- Direction `likert7-2`: exactly one integer 1–7 for each of twelve items; native radio group, seven circular controls with translated degree meanings. Switching overwrites the previous value. Numeric answers retain original construct meanings. Arrays are archived, never scored or converted, and the affected questions must be answered again. The archive survives later refreshes. Old scalar intake answers migrate to singleton sets; new required context is completed before reporting.
- Frozen v1 intake files support historical data and regression fixtures only. Current collection never creates the archived analytical null format.

## Analysis rules

All selected concerns, interests, experience forms, fields, barriers, goals and markets reach the personal model. Explicit primary concern and primary market drive focus. More selections do not award suitability points. Related interests expose source-backed occupational references.

AI mapping: Q13 explicit understanding → awareness; checking habits/G04 → inferred awareness; Q13 actual use modes and G03 → daily use; Q13 checking and G04/direction08 → verification; Q13 workflow/API/automation and direction07 → workflow; **only explicit Q13 API-building or tested automation → development experience**. AI coding-tool usage alone never establishes development. Unmeasured development becomes a specific role-connected exploration task. This is an evidence relationship graph, not a proficiency score.

General daily use and professional workflow use concern different contexts and never automatically conflict. The actual mutually exclusive claim “never used AI” versus active past-month usage is retained for review in the expandable methodology. All personal evidence remains self-report; no verified skill or success probability is fabricated.

What If reschedules prerequisite-ordered tasks, reviews and case development. Horizons show feasible stages, prerequisites, effort and role connections. Available hours are budgets, never automatic growth. Original answers and SDG results remain independent of scenario assumptions.

## Verification

- 203 frontend tests; 77 Python unittest cases; production build validates and packages 91 assets.
- Real browser: six personas × English, simplified Chinese, Malay; desktop 1440, mobile 390 and tablet 820. Complete both questionnaires, change radio selection, refresh intake and direction answers, read five pages, switch AI graph nodes, select route B, compare routes, open original DNA, change and restore What If parameters, and open SDG. No uncaught page errors, failed normal resources or horizontal page overflow.
- Six failure modes: source network failure, malformed source update, optional AI failure, blocked storage, navigation during delayed AI, reduced motion. Core remains usable. Simulated network/503 console messages are expected in those deliberately induced failures, not uncaught script exceptions.
- Computed text contrast checks cover five report pages plus every visible horizon text in the persona flows. Semantic foreground/background pairs correct both What If and other inherited light-text problems. Dark constellation surfaces retain light foregrounds. Readable SDG text uses ink while its data, artwork and behavior remain unchanged. Automated contrast does not substitute for a full accessibility audit.
- Optional AI availability is not required for the deterministic report. Official occupational text retains its English source language inside localized reports. Dated snapshots are not presented as live market feeds; planning effort is editorial, not an official training duration.

Reproduce using the repository's `verify-production.cjs` and `verify-resilience.cjs` scripts, with Playwright/Chrome paths supplied through their documented environment variables. Acceptance JSON and screenshots accompany this document.
