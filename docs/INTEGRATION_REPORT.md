# Team integration candidate — 2026-10-21

Branch: `codex/integration-hackathon`. Based on `origin/main` at
`5bdb965523389f2ac46daed20daab2929a6ffee4`. No production deployment or main merge.

## Branch inventory and provenance

| Audited remote branch | Audited head | Integration decision |
| --- | --- | --- |
| main | 5bdb965 | Base: competition template and team workflow |
| chore/team-workflow | e6b9511 | Its file tree already equals main; preserve existing CONTRIBUTING, issue/PR templates and team rules without duplicating the historical merge |
| feature/interactive-prototype-v0.1 | 7db7c84 | Visual foundation, four-step flow, responsive sage design and two explicitly scripted demo cases; already an ancestor of real-ai-mvp |
| codex/real-ai-mvp | 2abf265 | Real RunPod analysis, official source retrieval/citations, existing matching formula, asynchronous jobs, anonymous session/CSRF/quota protection; included through What-if ancestry |
| codex/questionnaire-i18n | aac3a2b | Primary choice-questionnaire implementation; shared option IDs, canonical server mapping, EN/zh-CN/MS UI and model-language context; merged explicitly |
| codex/what-if-simulator | e2265fe | Uploaded existing local work first, then merged: deterministic interactive planning and conservative report readability refinements |

The first five heads were the complete remote branch inventory before uploading
What-if. No separate newer UI-only branch exists in that inventory. The integrated
visual design therefore retains the UI prototype and its subsequent questionnaire
choice-card/responsive improvements. No teammate branch was deleted or force-pushed.

## Conflict resolutions and targeted compatibility work

Five content conflicts were resolved: `prototype/app.js`, `prototype/live.js`,
`prototype/styles.css`, `src/career/api.py`, `.github/workflows/ci.yml`.

- Combine questionnaire navigation, global language selection and What-if state.
  Scenario direction stays synchronized with the selected report/action-plan path.
- Retain localized report rendering, safe escaping, official references and the
  conservative adjacent-duplicate/citation/limitation cleanup. No advice truncation.
- Combine both CSS additions with the inherited responsive visual system.
- Serve the union of explicitly approved frontend modules/catalogs; secrets,
  source files and test harnesses remain outside the asset allowlist.
- CI checks both new feature modules and all Node tests alongside Python tests.
- Replace the questionnaire branch's multiple required Other-description fields
  with exactly one optional step-4 `additionalContext` textarea (max 1600 chars).
  Every Other option can be selected without typing. Keep all preset categories,
  two-task minimum, mutually exclusive None selections and fictional-data consent.
- Preserve older text-profile and `answers.custom` API inputs. New selections are
  authoritative and use canonical English labels regardless of UI language.
  Optional context reaches the inference prompt unchanged, but does not alter the
  scoring algorithm. Unspecified Other details cannot establish a specific skill.
- Both example profiles now have editable choice presets. Their original nuance
  is retained in the single supplemental field instead of hidden custom inputs.
- Shared language selection controls What-if too; changes preserve its scenario.
  Generated prose is not silently translated when switching interface language.

`src/career/matching.py`, `access.py`, source retrieval, RunPod endpoint/key handling,
`.replit`, original `src/main.py` and `runpod/handler.py` are unchanged from the
existing real-AI branch. All tracked files from main remain; template directories,
submission PDFs, tests and team collaboration files are retained.

## Verification

- Python 3.12: **38 tests passed**, `python -m unittest discover tests -v`.
- Node 24: **31 tests passed**, `node --test prototype/*.test.mjs`.
- JavaScript module syntax and `git diff --check` pass. The frontend has no separate
  compilation/build or TypeScript step; it is native browser ES modules.
- Tests cover old API compatibility, canonical choices in all three languages,
  one optional textarea even with all Other choices selected, empty supplement,
  invalid/contact input, actual HTTP submission to the inference boundary with
  supplemental context, safe asset routing, quotas, CSRF and private job ownership.
- What-if tests preserve scores, total work, task order, deliverables and official
  links, including alternate path, salary warning, shorter review and all locales.
- Chrome local checks: marketing and admin presets; four-step navigation; Other
  without extra fields; empty supplement accepted; consent required; asynchronous
  submit/poll/report flow; EN/ZH/MS switching with draft preservation; What-if
  slider, salary priority, Path B, early review, report/action-plan synchronization.
- `evidence/integration-local-fixture.png` is **isolated synthetic UI fixture
  evidence, not a newly generated AI report**. The ignored local harness disables
  provider credentials; it is not shipped or used by normal application routes.

No paid GPU calls were made for this integration. Live RunPod generation in all
three languages, latest external source availability, physical mobile devices and
production deployment have not been reverified. Existing responsive breakpoints
are preserved; desktop appearance was inspected. Known model/source/quota limits
remain documented in `KNOWN_ISSUES.md`; no unsupported salary prediction is added.

## Review and release boundary

Ready for a team review/PR targeting main; local integration checks pass. GitHub CI
must pass on that PR and reviewers should check the retained UX before merging.
This report does not claim a new production acceptance. Deployment remains a
separate explicitly authorized action. No production secret or endpoint changed.
