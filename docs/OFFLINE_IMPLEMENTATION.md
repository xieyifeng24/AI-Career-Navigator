# Offline career and SDG questionnaire candidate

Branch: `codex/offline-career-sdg`, based on the committed three-language version
`aac3a2b`. Original checkout, `main`, and `codex/questionnaire-i18n` are preserved.
No commit, push, merge, release or deployment was performed by this task.

## Preview

From this checkout, run:

```bash
python3 prototype/server.py
```

Open http://127.0.0.1:4173 . No pip install, RunPod key or online analysis is needed.
A pre-existing server was already running during QA; it was reused and not stopped.
The agent sandbox could not start a second listening socket, which did not prevent
browser verification against the existing server.

## Architecture

The existing HTML/CSS/ES-module stack, translation helper and design tokens are
retained. `index.html` now loads `offline-app.js`, a dedicated questionnaire/report
controller. This entrypoint imports only `explorer-engine.js`, `explorer-views.js`,
`i18n.js`, the local catalogs, CSS and character artwork. It makes no API request.
The old `app.js`, live renderers, backend, RunPod model/endpoint/quotas, schemas,
database and deployment settings remain available in source and are not replaced.
The only backend edit expands the explicit public-asset allowlist to serve the new
public files. Offline profiles are never submitted to the older online schema.

`explorer-catalog.json` is the versioned, trilingual source for 17 questionnaire
fields, 24 career directions, 17 goal characters and 32 advice modules. Nationality
is a separate optional dropdown with 249 region codes and undisclosed. The browser's
bundled Intl locale data supplies region labels; codes and rankings remain stable.

The pure rule engine validates all active selections, removes hidden fields and
normalises multi-select order before producing a report. All possible report
components are prewritten, not generated at runtime. `outputInventory()` enumerates
the complete vocabulary; `possibleProfileCount()` counts valid input combinations
using the conditional fields. The count includes optional demographic choices and
is not a claim of distinct careers, scientifically validated categories, job-market
forecasts or exhaustive enumeration of trillions of full reports.

Career weighting, SDG weighting, safe pacing and every output module are documented
in [OFFLINE_OUTCOMES.md](OFFLINE_OUTCOMES.md). The raw catalog is downloadable from
the in-app All outcomes & rules screen. Hidden university/AI answers do not affect
results. Age bands and hour/month ranges use explicit non-overlapping boundaries.

Gender and nationality never influence career or SDG ranking. Age/education stage
adapt learning actions; personality adapts work habits. Self-rated learning ability
adjusts support and pacing, never career eligibility. Minors receive exploration,
not immediate-employment guidance. All 24 directions remain available and selectable
as plan focuses. Regulated professions carry qualification caveats.

The three-letter shorthand (I/E, J/P, R/F) reflects only the three selected
preferences. It is not a validated MBTI type, diagnosis or biological brain label.
The 17 original illustrated archetypes are fun editorial links to UN goals. They
are not official UN characters, endorsement or proof of measured SDG impact.
Official goal source: https://sdgs.un.org/goals (checked 22 October 2026).

The original 6×3 character sheet is stored intact as `sdg-characters.png`; CSS shows
17 distinct cells, with the eighteenth cell blank. No runtime image generation or
external asset CDN is used. Image generation happened once during development;
report generation itself never uses an image or text generation service.

## Stable results and local privacy

- No date, random value, network response or locale changes the report rankings.
- Ties use fixed catalog ordering, with an exact reviewed fixture for regression.
- Language switching re-renders all prewritten content immediately, preserving data,
  scores, career focus, profile and selected companion.
- The draft/report stay in tab memory. Only the language preference persists.
- Export is a user-initiated local JSON download; printing uses browser print/PDF.
- The selected plan and viewed companion are included in JSON export. The export
  contains stable IDs and the rule version, not API keys or provider metadata.
- No claim of real AI inference appears in the new interface.

## Executed verification

**39/39 Node tests passed**, including all 22 existing tests. Checks include:

- Every scalar option and conditional field state.
- Every non-empty interest, learning-style and mindset subset.
- All AI-use subsets and non-use, with every duration/reliance combination.
- Reachability and existence of every advice branch.
- All 24 selectable career plans across age/time/support settings.
- All 17 SDGs and distinct illustrated cells, trilingual catalog/page rendering.
- Stable ordering across language, repetition and selection order.
- Demographic neutrality and non-exclusionary support recommendations.
- No-network import graph and operation with fetch disabled.
- Exact reference-report fixture and direct UI translation-key coverage.
- JavaScript syntax, Python compilation of the public-asset edit and diff whitespace.

Browser verification used the already running http://127.0.0.1:4173 server:

- Chinese complete intake -> Chinese offline report.
- English complete intake -> English offline report.
- Malay complete intake -> Malay offline report.
- Mid-form language change retained selected answers.
- High-school stream replaced university major and restoring the degree retained
  the prior major; hidden data did not reach reports.
- Interest check/uncheck and no-AI exclusivity worked; AI duration/reliance hid and
  returned appropriately.
- Changing report language retained report content and career ordering.
- Choosing another career changed the selected four-week plan.
- All 17 companion cards appeared; selecting goal 17 changed the displayed character.
- Complete result-catalog download link was present.
- Local report export downloaded successfully, with no browser errors/warnings.
- Desktop 1440px and mobile 390px had document width equal to scroll width; mobile
  header, navigation, plan cards and time split were visually inspected.

Temporary QA screenshots are kept only in ignored `.cache`, not release evidence.
The browser viewport override was reset after QA. Full backend Python tests and a
production release were not required for the offline logic and were not executed;
no claim is made that this candidate has been deployed or live RunPod-tested.

## Run checks

```bash
node --test prototype/*.test.mjs
node --check prototype/offline-app.js
node --check prototype/explorer-engine.js
node --check prototype/explorer-views.js
```
