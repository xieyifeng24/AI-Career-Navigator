# Production release — 24 October 2026

Authority: GitHub main `5ce584b410ce47c193fd6bbaca55742bb7c9e4aa`, confirmed using `git ls-remote`. Work was performed in its existing clean main checkout. No branches were created, switched, merged or removed. The original cinematic-introduction checkout and its pending teammate changes were not modified.

## Product changes

- Rebuilt the homepage with an editorial layout, an animated explanatory career graph, clear occupational source scope and a direct assessment entry. Legacy demos and version links do not appear in the current user journey. The full cinematic introduction remains available through explicit URL entry, without interrupting ordinary entry.
- Unified typography, spacing, navigation, questionnaire choices, five report pages, responsive layout and motion. Full-width analytical areas replace repeated small containers. The original PR #14 constellation, route comparison and Skill DNA functions are reused. The DNA canvas can scroll horizontally without cutting off the second route; its inspector moves below the graph when space is constrained.
- The first report screen now shows the selected field, source-backed task categories, a labeled AI transformation hypothesis, reported starting clues, a requirement to investigate and a concrete next experiment. Counts describe tasks, never job-loss probability or personal capability.
- What If retains the existing calculation and adds a baseline/scenario milestone graphic. Time, target role, priority and assumed evidence change real stage timing; original answers remain unchanged. Scenario controls survive refresh. Browser history restores report and questionnaire context.
- SDG calculation, data, catalog, characters and main interactions are unchanged. Only shared presentation styles apply.

## Answer and evidence contracts

The reviewed 84-item V3 question bank remains unchanged as historical task context (4 general + 8 selected-direction questions). The new `behavior-evidence-1` response contract provides translated complementary behaviors for every construct, with at most three selections, strict option IDs, duplicate rejection and an exclusive `none` answer. Unknown remains independent, not zero. A question context identifies which task each answer describes.

Behavior evidence uses a bounded weighted mean of selected evidence strengths. Selecting additional equivalent options cannot increase the indicator. Question/role emphasis remains explicit in the existing role rules. Indicators are used for exploratory task ordering, not displayed as capability percentages. All personal evidence remains self-report. Task-specific checking and general checking can disagree, without discarding either answer. A reported artifact that conflicts with an intake claim of theory-only learning is surfaced as a context question, not discarded or treated as verified experience.

Original ordinal answers are retained as numbers, displayed as historical evidence, and never silently migrated into behavioral options. Mixed-format dimensions are marked mixed; mixed-format role indicators do not establish an ordering. Historical and new formats are not longitudinally comparable. The evidence engine is versioned `evidence-engine-1.1`, invalidating old computed-report caches while retaining answer drafts.

The optional AI endpoint validates the new option IDs and returns only approved evidence statements selected by the model. A failed or unconfigured AI service leaves the deterministic report intact. No core submission invokes paid AI.

## Source integrity and recovery

The assessment now consumes the active validated snapshot rather than continuing to calculate from an old import after a public-data refresh. Validation covers provenance URLs, dates, arrays, labels and every reviewed occupational mapping. ESCO skill relations are allowed to have no task list. Invalid updates, empty updates and transport failures retain the actual bundled/current validated records. Cache signatures include knowledge and regional versions; report identifiers include both datasets.

Regional responses actually enter the assessment calculation. Source dates and geographical restrictions remain visible. Official excerpts remain in English and are marked as such; newly authored interface, questions, choices, chart labels and errors support English, Simplified Chinese and Malay.

Supplementary view failures expose a visible recovery message and retain the truthful core occupational summary and evidence export, rather than leaving an empty page. Storage failure permits answering in memory. Reduced-motion preferences disable animation. Navigation transitions run only on navigation; changing What If animates changed milestone widths without fading the whole page.

## Verification

- Native-module build validates JavaScript syntax, JSON and relative imports, and packages the assets into ignored `dist/site`; the existing FastAPI server continues to serve the same source assets from an explicit allowlist.
- 208 JavaScript tests; 74 Python tests. The changed protection assertions exclude only the explicitly authorized questionnaire/model/translation edits. Original author banks, SDG logic and assets remain hash-protected.
- Actual Chrome flows: English 1440px, Chinese 390px, Malay 820px. Each completes both questionnaires, opens all five report pages, changes a constellation node, opens comparison and Skill DNA, changes What If time, reloads the scenario and goes back. No page errors, failed resources or document-width overflow. See `browser-acceptance.json` and screenshots.
- Controlled browser failures: occupational source transport failure, malformed source update, optional AI 503, blocked browser storage and reduced motion. Core content remains usable with no uncaught script errors. A legacy saved profile without the newer starting-point questionnaire also remains viewable; it is no longer stripped of required legacy learning values on mount.
- The local real optional-AI request accepts the multi-select request shape, then returns 503 because AI is not configured. Live AI generation quality is not certified by these tests.

Reproduce with Node 22+ and Python dependencies installed:

```
node --test prototype/*.test.mjs
python -m unittest discover -s tests
node scripts/build_frontend.mjs
```

Browser scripts are `scripts/verify-production.cjs` and `scripts/verify-resilience.cjs`. They require Playwright and a running API; set `CAREER_PLAYWRIGHT_MODULE`, `CAREER_CHROME_PATH`, and optionally `CAREER_BASE_URL` when using an existing runtime/browser. Their sample inputs are synthetic acceptance fixtures, not real-user outcome evidence.

## Limits and publication

GFNC could not be located in the project source, content or datasets. No expansion or substitute module was invented. This remains a content-identification item.

The behavioral evidence framework is an exploratory product heuristic, not a validated psychometric instrument. No professional skill is independently certified. Malaysian role-specific market coverage remains limited to the existing reviewed roles; US occupational facts are not Malaysian hiring or licensing predictions. Learning effort remains a planning estimate.

Replit inspection found the original site still serving older resources and its main checkout diverged from GitHub, with only saved `.replit` configuration changes in its unique history and no pending files. Publication must preserve that recoverable history/configuration and use this verified release, not simply republish the old checkout. Live publication status and fingerprints are recorded separately after release.
