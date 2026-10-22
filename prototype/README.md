# Frontend

The default page is the offline questionnaire and report candidate. The established
ivory/green design system and three-language architecture are preserved. No frontend
build tool, package installation, backend or API key is required for the new flow.

```bash
python3 prototype/server.py
```

Open http://127.0.0.1:4173 . The four steps lead to local career exploration, AI-use
advice, a selectable four-week plan and 17 illustrated SDG companions.

- `offline-app.js`: local routing, form state, report generation, export and print.
- `explorer-engine.js`: pure, versioned validation, normalisation and ranking rules.
- `explorer-catalog.json`: all trilingual field options and possible output modules.
- `explorer-views.js`: translated, escaped questionnaire and report templates.
- `explorer.css`: responsive additions using the existing `styles.css` design tokens.
- `sdg-characters.png`: original 17-character illustration sheet, displayed by CSS.
- `i18n.js` / `translations.json`: shared language detection, persistence and copy.
- `app.js`, `live.js`, `logic.js`, `data.js`, `questionnaire.js`: retained previous
  online/demonstration implementation; not imported by the new entrypoint.

Checks: `node --test prototype/*.test.mjs`.

[Complete output catalog](../docs/OFFLINE_OUTCOMES.md) and
[implementation + verification](../docs/OFFLINE_IMPLEMENTATION.md) describe the
rules, all result components, demographic boundaries and executed browser checks.
The previous upgrade remains documented in
[QUESTIONNAIRE_I18N](../docs/QUESTIONNAIRE_I18N.md).
