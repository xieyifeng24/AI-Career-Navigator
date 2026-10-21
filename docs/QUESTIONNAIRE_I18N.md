# Questionnaire and three-language upgrade

## Scope and branch

Based on `codex/real-ai-mvp` at `5cdb037`, on the independent local branch
`codex/questionnaire-i18n`. The original checkout and `main` remain unchanged.
No commit, push, merge, Replit operation, deployment, runtime secret, RunPod model,
endpoint, worker setting, quota database or access-policy change is included.

## Contract and compatibility

The existing text-only `Profile` remains accepted, defaulting to English. New clients
send an optional `answers` object and `language` (`en`, `zh-CN`, `ms`). Both existing
analysis routes and `/api/match` continue to accept the same `Profile` type.

Example new request (legacy text fields may be omitted):

```json
{
  "language": "ms",
  "answers": {
    "background": "software",
    "experience": "student",
    "tasks": ["code", "research"],
    "skills": ["programming", "critical"],
    "aiUsage": "frequent",
    "concerns": ["automation", "skills"],
    "goal": "internship",
    "constraints": ["budget"],
    "custom": {}
  },
  "hours": 3,
  "synthetic": true
}
```

`prototype/questionnaire.json` is the shared authoritative option catalog. Each row
contains a stable ID and reviewed English, Simplified Chinese and Malay labels.
Pydantic rejects invalid IDs, duplicate selections and
mutually exclusive values. `none` is exclusive for both concerns and constraints.
At least two tasks are required to support the existing two-task report contract.
Other is selectable for role, tasks, skills, concerns, goal and constraints without mandatory typing. The integrated UI has exactly one optional `additionalContext` textarea on step 4. It is length-bounded, checked for contact details and sent intact to model context. Unknown details are not inferred. Legacy `answers.custom` remains accepted for older clients; no per-question custom textboxes are rendered.

The server derives the legacy analysis text from validated selections, overriding
conflicting client-supplied text. All option selections, additionalContext and legacy custom input also
reach the actual model context. This keeps the existing English lexical matcher
consistent for preset answers across locales. Custom non-English free text still
has the matcher's existing English lexical limitation; model interpretation receives
the original custom text. No matching coverage or occupational data was fabricated.

`answers` stays available in the validated profile; it is not reduced to translated
labels. Unselected Other drafts remain in browser memory for editing but are pruned
from submission. No draft/profile persistence was added; only the chosen language
is saved to localStorage. The server's existing ephemeral reports and anonymous
session protections are preserved.

RunPod uses the original HTTP path, model, response validation and error behavior.
The selected language controls both the system prompt and previously English-only
schema prefixes. Schema IDs, enum values, exact input quotes and supplied skill
names remain stable for evidence validation; all explanatory prose is requested in
the report language. The returned report includes its `language`. Changing UI language
does not translate an already generated report by making an undisclosed paid call:
the interface explains how to regenerate it in another language, preserving answers.

## Interface and translation architecture

- Native radio/checkbox controls, dropdowns and responsive choice cards replace the
  text-heavy form. Custom text is conditional; no typing is needed for preset answers.
- Selected and keyboard-focus states use the existing green visual system. The
  four-step progress indicator, navigation, sources, matching and explicit legacy
  scripted demo are preserved.
- `i18n.js` provides locale detection, user preference persistence, interpolation,
  UI localization and safe error mapping. English source strings are translation keys;
  `translations.json` contains Chinese and Malay resources for shared product copy.
- The primary browser language is used when no saved choice exists; unsupported
  languages fall back to English. Manual selection has precedence on future visits.
- The visible language dropdown updates interface text, errors and document metadata.
  Data values, source links, citations, authored input and generated report prose are
  not rewritten by the interface translator. Official research titles remain original
  citation titles; unavailable external metadata is not silently invented/translated.
- A report-language mismatch is shown explicitly. Existing reports remain visible.
- The original API asset allowlist adds only the public JS/JSON resources. Keys remain
  server-side. No user-entered access code is added; anonymous session/CSRF is retained.

## Verification on this machine

Executed successfully:

- `node --test prototype/*.test.mjs`: **22/22 passing**, including all 9 existing tests.
- JavaScript syntax checks and Python source/test compilation.
- Unittest discovery attempted: 3 standard-library tests passed; backend suites could
  not import because FastAPI/httpx/Pydantic are missing (not a backend test pass).
- All retained demo content strings have Chinese and Malay resource entries.
- `git diff --check` and original checkout inspection (clean, still on `main`).

New Python contract tests are in `tests/test_questionnaire.py`; they cover optional
legacy compatibility, all IDs, all locales, canonical matching parity, prompt/schema
language, authoritative structured input, Other, exclusivity and invalid input.
They are included in normal unittest discovery; new JS tests are included in CI.

**Runtime verification remains blocked:** the available system Python is 3.9, while
this project requires Python 3.12. Backend dependencies are absent and package-index
DNS/network access fails. The sandbox also denies binding a local preview port.
No dependency pins or security settings were changed to bypass those restrictions.
No current RunPod credentials were present in this independent checkout. Historical
production evidence in `docs/evidence` predates this change and is not new acceptance.

| Requested acceptance | Current evidence |
| --- | --- |
| Chinese full intake + Chinese real report | Intake, serialization, localized rendering tested with fixtures; real generation pending |
| English full intake + English real report | Intake, serialization, localized rendering tested with fixtures; real generation pending |
| Malay full intake + Malay real report | Intake, serialization, localized rendering tested with fixtures; real generation pending |
| Switch language without losing answers | Unit-tested state, draft and preference preservation; browser check pending |
| Single/multi/Other behavior | Unit-tested including none exclusivity and unchecked answers; browser check pending |
| Frontend/backend schema compatibility | Shared catalog + authored Python contract tests; Python execution pending |
| RunPod API works | Existing implementation retained; live integration pending |
| No unknown Team demo access code | Anonymous session/CSRF submission tests pass |
| No sensitive API key in frontend | Static assets and server-only credential path reviewed |
| Existing functions remain working | 9 existing JS tests pass; full backend/browser regression pending |

For complete acceptance on a configured Python 3.12 machine:

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m unittest discover tests -v
node --test prototype/*.test.mjs
.venv/bin/python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8000
```

Use existing server-only configuration without copying secrets into code. In the
browser, complete the four steps in each language with fictional input, switch
language while the optional supplement is being edited, revisit each step, test none/Other,
submit, review the actual report language and source evidence, navigate both paths,
and inspect a narrow mobile viewport. Record actual inference IDs and review model
output before marking the three real report checks complete. This branch performs
no automatic paid smoke tests or deployment.

## Open the independent checkout

GitHub Desktop's window connection returned `noWindowsAvailable` while adding the
checkout, so automatic registration was not confirmed. Use File → Add Local Repository
and select:

```text
/Users/xenonyoung/Documents/Codex/2026-10-21/new-chat-2/work/AI-Career-Navigator
```

The selected branch is `codex/questionnaire-i18n`. Changes remain uncommitted for
review. Its origin points to the existing team GitHub repository; the new branch has
no upstream, avoiding accidental pushes onto the existing MVP branch. The original
checkout at `/Users/xenonyoung/Documents/GitHub/AI-Career-Navigator` remains on clean
`main`.

## Integration verification (2026-10-21)

See [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md) for the current combined test results and browser checks. Earlier pending-check tables above describe this branch before integration. The single optional supplement supersedes the original per-question Other-description requirement.
