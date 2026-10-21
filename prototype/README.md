# Frontend

The existing HTML/CSS/ES-module visual design is preserved. No frontend build tool
is required. Start the full app with the Python 3.12 commands in the root README.

- `app.js`: navigation, four-step fictional profile, consent, loading and errors.
- `live.js`: API boundary, safe report rendering, public source and matching views.
- `logic.js`: form validation and explicit legacy demo assembly.
- `data.js`: two fictional scripted V0.1 cases, never imported by the backend.
- `styles.css`: shared responsive visual system.

The landing page exposes live-source matching and real-AI analysis separately.
“Open scripted V0.1 demo” is the only intended route to the old mock reports.
There is no automatic fallback from a failed model request.

`python3 prototype/server.py` remains available as an offline static preview at
port 4173. Only the explicitly selected scripted mode works without the API;
public source and real AI features require `src.career.api:app` on port 8000.

Frontend checks: `node --test prototype/*.test.mjs`.

The structured questionnaire, language behavior, API compatibility and verification
limits are documented in [QUESTIONNAIRE_I18N](../docs/QUESTIONNAIRE_I18N.md).
