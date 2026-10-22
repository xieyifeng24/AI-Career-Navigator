# Shared assessment, Star Map, Skill Tree and What If

## Branch and preservation

Implementation branch: `codex/unified-career-results`, separate worktree `.cache/worktrees/unified-results`, based on `594d456` (the approved PR #8/#9 integration). The original checkout's uncommitted documentation, evidence and workbook were not altered. No branch was deleted or force-pushed. This phase is local implementation, not a production release.

## Inspected sources and conflicts

| Source | Inspected head | Reused implementation and boundary |
|---|---|---|
| main | `5bdb965` | Collaboration/CI scaffold; product implementation remains on PR branches. |
| PR #3 | `2abf265` | Existing backend matching and RunPod remain intact; their older report contract is not used to reinterpret the current answers. |
| PR #5 | `aac3a2b` | Existing i18n module and trilingual choices retained. |
| PR #6 | `5a1d07c` | `prototype/star-map.js`, `career-explorer.js` and their CSS contain the existing constellation and Skill DNA interactions. The current branch already included adapted versions. New model-specific renderer exports reuse their visual/node structure and selection controls, leaving legacy renderers intact. |
| PR #8 | `b8a7610` | `explorer-engine.js` and `explorer-catalog.json` retained byte-for-byte: 24 careers, deterministic ranking and learning plans. |
| PR #9 | `ca3cd48` | Local-first integration, intro and authoritative V3 bank retained. V3 remains isolated self-report; no new scoring weights or question translations. |

Main conflict: PR #6 expects A/B/C paths with old AI-report fields; PR #8 has 24 stable catalog IDs and raw rule points. No direct conversion from V3 1–7 answers to old abilities is justified. Old What If scheduling assumes generated path weeks and cannot recalculate PR #8 ranking. The new controller calls PR #8's original `generateOfflineReport` and `buildPlan`, rather than adding a competing algorithm or invoking the old scheduling-only API.

## Unified contract

`prototype/combined/results.js` derives one active result for dashboard, career list, map, tree, original report tabs and roadmap:

- `careerFit`: original raw rule points, never a percentage or probability.
- `aiReadiness`: unavailable numeric score; existing AI habit/advice IDs retained.
- `recommendations`: original ranking, stable career IDs, reasons/components, localized catalog titles, requirements and plans.
- `careerSkillRequirements`: existing editorial catalog requirements, stable career/skill IDs.
- `skillGaps`: quantitative assessment unavailable; individual requirements unassessed unless explicitly assumed in What If. Missing answers are not proof of missing skills.
- `careerTransformation`: unavailable, no fabricated forecast.
- `learningRecommendations`: same-engine plans, existing projects, unassessed practice priorities and skill assumptions to verify.
- V3 self-report and optional free-text context remain separate and unscored.

The bundled existing knowledge snapshot is reused. Reviewed contextual crosswalks are explicit for data, marketing and business analysis; these are not asserted to be exact occupational equivalences. Other careers show no reviewed mapping. US/EU sources retain geography/date/version and official links. No database refresh or trend architecture changes were made.

## What If and state

The original profile/report is immutable by convention and copied before simulation. Separate patches support interests, thinking preferences, relevant subject background, self-described learning needs and study time. Every scenario calls the same PR #8 scoring and planning engine. Skill assumptions only update explicit hypothetical skill states/practice priorities; PR #8 has no proficiency scoring weights. More study time changes plans, not fit points.

The selected career uses one stable ID across map, tree and roadmap. Scenarios remain active across tabs/languages/refresh, show a hypothetical banner and can be reset with one button. Export preserves original ranking/profile and includes an explicitly separate scenario and selected roadmap. V2 letters and V3 numeric/unknown answers are never converted. Optional context is escaped, limited to 1500 characters and not parsed for skills.

## Changed files

- New: `prototype/combined/results.js`, `ui.js`, `copy.js`, `prototype/unified-results.test.mjs`, `tests/test_unified_results.py`, this document and browser evidence.
- `prototype/combined/app.js`: shared-result routing, scenario controls/reset, selection, export and optional notes.
- `prototype/combined/model.js`: isolated scenario persistence and validated restoration.
- `prototype/combined/styles.css`: responsive catalog grid using existing PR #6 visual styles and additive controls.
- `prototype/star-map.js`, `prototype/career-explorer.js`: unified-result exports alongside untouched legacy renderers.
- `prototype/explorer-views.js`: optional content/navigation extension points, original report templates retained.
- `prototype/translations.json`: navigation labels only.
- `prototype/combined.test.mjs`: preserve engine/catalog hash checks; remove obsolete view-byte equality check because the report shell now has explicit extension points.
- `src/career/api.py`: allowlist the three new public browser modules; no inference endpoint changes.

## Verification

- 132 JavaScript tests pass, including all existing tests and 7 new integration tests.
- 61 Python tests pass, including integrated asset loading and private-file rejection.
- Existing tests cover 10 V3 directions × 3 languages; new tests verify map rank/ID parity, every career's skill tree, unchanged scores, same-engine scenario equality, immutable original profile, unavailable metrics, isolated restore, export and no network dependency.
- Browser: completed all four base-question steps, optional fictional context and 12 V3 questions including unknown; generated the report with RunPod credentials disabled.
- Browser: map top ranks matched dashboard (data 18, software 17); selected software tree showed Programming/Testing/Version control.
- Browser: art-interest/major scenario reranked careers; software focus stayed synchronized. Study-time change produced a 12-hour plan; Programming assumption stayed explicitly unverified. Refresh preserved the scenario. Reset restored data's rank 1/18 points and removed assumed skills.
- Browser: English, Chinese and Malay screens checked; Malay What If had no Chinese residue. No browser console errors. Server requests showed static assets/health/knowledge only, no inference request.
- Actual downloaded JSON inspected: original software profile, separate art scenario, selected software plan, optional context and V3 unknown answer retained.

## Limits

There is no validated AI-readiness score or measured skill-gap baseline. V3 remains unscored. Hypothesized skills do not affect career fit because the preserved engine has no such weights. Official source mappings do not cover all 24 careers. No paid GPU test, production deployment or full audit of unrelated legacy screens was performed in this phase.
