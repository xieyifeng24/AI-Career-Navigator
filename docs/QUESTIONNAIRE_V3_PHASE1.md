# V3 questionnaire — phase 1 only

## Scope and review entry

Branch: `codex/questionnaire-v3-phase1`, based on stable `5a43eb7`.
Worktree: `/Users/mac/黑客松/.cache/worktrees/questionnaire-v3-phase1`.
Preview: `http://127.0.0.1:8046/?assessment=v3`.

Only answer collection and answer review are implemented. There is **no V3 score, recommendation, report, What If adaptation, or AI request**. All twelve completed answers lead to an editable answer review, not to the V2 reporting engine. The author's `submit` label (“View my exploration report”) is intentionally not presented as a working action in this phase.

Without `?assessment=v3`, the existing application loads unchanged, including its introduction and V2 questionnaire. The original checkout and its 8045 preview are untouched. Nothing has been pushed or deployed. Phase 2 requires separate user approval.

## Safety and source integrity

Before editing, the existing modified `docs/INTEGRATION_REPORT.md` and three untracked files were copied to the ignored directory `/Users/mac/黑客松/.cache/backups/v3-phase1-20261022-152523`. SHA-256 verification passed for all four files. Binary working/staged patches and a hash manifest were also saved. No original files were stashed, reset, removed or replaced.

Authoritative input:
`/Users/mac/Downloads/AI_Career_Navigator_Question_Bank_V3_trilingual.json`.

`prototype/v3/bank.json` is a byte-for-byte copy, with SHA-256:
`0e1c448c6605e60a40364fd8c7cb1f0546470611f66f11c7d37d99802ff0cd3d`.

The bank validates as version 3.0.0: 84 unique questions, four GENERAL questions, ten tracks with eight questions each, seven numeric values 1–7, null for not applicable, and complete nonempty en/zh-CN/ms fields. Track IDs are unchanged: SW, DATA, FIN, PM, MKT, DES, ENG, HLT, EDU, OPS. Question order follows the supplied file. Every session has four GENERAL questions followed by eight questions in its chosen track.

The file classifies exploration, adaptability, interest, work style, experience, AI practice and AI verification. It states interpretive boundaries but provides no complete numeric weighting, threshold or matching formula. None has been invented. It is a self-report instrument, not MBTI itself, a knowledge examination or objective skills verification.

All question statements, response labels, construct labels and question help are read from the author file. Remaining navigation/review/error strings reuse the existing translation catalog. No new assessment questions or translations were authored. Missing shared translations throw rather than silently falling back to mixed-language text.

## Behavior

- Default fresh V3 language: English, from the bank. V3 does not change the saved V2 language preference.
- One question at a time, seven visible radio levels, a distinct not-applicable radio, previous/next controls, answered-count progress, visible selection and keyboard focus.
- No automatic next on selection; no forced guesses. An unanswered question prevents advancement with an existing translated error message.
- Answers are stored under language-independent question IDs as integer 1–7 or explicit null. Absent keys mean unanswered. Null is distinct from 4 (neutral), 1 (strong disagreement) and missing.
- Session state is versioned 3.0.0 and uses only `sessionStorage['career-questionnaire-v3-phase1']`.
- Language changes preserve direction, current question and all answers. Reload within the same tab restores them, including unknown values and review mode. Closing the tab ends the session; persistence across devices or browser sessions is outside scope.
- Malformed state, mismatched versions, letters, numeric strings, foreign question IDs and invalid answer ranges are rejected. V2 answers are never converted. V3 entry points also reject non-V3 state objects.
- Returning to direction selection preserves existing answers. Choosing a different track retains common answers and removes answers belonging to the previous track. Reset clears only the V3 draft and retains its selected language.
- The review page lists the original translated statements and selected scale labels, with links back to edit individual questions.
- Mobile styles keep all seven levels visible, wrap long Malay labels and simplify the header. Reduced-motion disables the preview transition. Only question navigation animates; selecting an answer or switching language does not replay the heading animation.

## Necessary public-file changes

1. `prototype/index.html`: the module entry changes from app.js to bootstrap.js.
2. New `prototype/bootstrap.js`: explicit `assessment=v3` query loads V3; all other visits import the original app.js.
3. `src/career/api.py`: allow bootstrap.js and five explicitly named `/v3/` static assets; no business/inference/data API changes. The source manifest and arbitrary repository files remain inaccessible.

The V3 stylesheet loads only in preview mode and uses namespaced selectors. `prototype/app.js`, the V2 engine/data/UI/report, local/report/What If code, global stylesheet, translation catalog, i18n module, intro, official data, RunPod configuration, Replit configuration and CI workflow are unchanged.

## Tests and evidence

- Full Node suite: **103 passing** (66 existing + 37 V3).
- Full Python suite: **58 passing** (56 existing + 2 V3).
- Syntax checks pass for the bootstrap and all V3 JavaScript modules. `git diff --check` passes.
- Actual browser: **30/30 complete flows**, ten tracks × three languages, **360 exact rendered question comparisons** against the original bank. Each flow checks eight choices, selects all twelve answers including null and neutral, refreshes at question four, and reaches twelve-answer review. English/Malay question and review text is checked for unintended Chinese; the language selector legitimately includes “简体中文”.
- Additional browser checks: empty-answer error; English → Chinese → Malay switching on answered questions; unknown answer retained through previous/next and refresh; normal V2 entry still has its original ten directions; returning from V2 to V3 preserves DATA/G03/unknown and the selected language. Browser console had no errors.
- Real RunPod credentials were explicitly disabled in the separate preview process. The V3 import graph contains no inference/scoring/report requests. It loads only same-origin static assets.
- No changes under twelve protected source/data/configuration paths/groups compared with the stable commit.
- Browser record: `docs/evidence/v3-phase1-browser.json`; screenshots: `v3-phase1-en.png`, `v3-phase1-zh.png`, `v3-phase1-ms.png`.

## Remaining work and limits

- V3 scoring, report generation and What If integration are intentionally **not implemented**. Their existing V2 counterparts remain available via the normal entry.
- Responsive and reduced-motion CSS are implemented; physical mobile-device/browser and OS reduced-motion checks were not available in this browser-control environment.
- If sessionStorage is disabled or full, answering still works in memory but refresh restoration is not guaranteed. Unit tests cover this fallback; there is no fabricated persistence claim.
- Only known UI/catalog languages are supported; no translations or psychometric validity are asserted beyond the supplied content.

## Local reproduction

From this worktree:

```sh
node --test prototype/*.test.mjs
/Users/mac/黑客松/.venv312/bin/python -m unittest discover tests -q
RUNPOD_API_KEY='' RUNPOD_ENDPOINT_ID='' /Users/mac/黑客松/.venv312/bin/python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8046
```
