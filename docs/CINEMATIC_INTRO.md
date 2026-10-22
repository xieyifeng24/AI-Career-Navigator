# Cinematic product introduction

Implemented on `codex/cinematic-introduction`. This change is local; it does not publish to GitHub or Replit.

## Experience and replay

A new tab session automatically plays six English scenes (3.5 + 4 + 3.5 + 4.5 + 4.5 + 4 = 24 seconds), followed by a 650 ms dissolve into the existing V2 ten-domain selector. No assessment answers or privacy confirmations are submitted by the introduction. The existing questionnaire's fictional-scenario notice and entry remain intact.

- Local preview: `http://127.0.0.1:8045/?intro=replay`
- Any deployment: append `?intro=replay` to its root URL. The parameter is consumed without reloading; refreshing later does not force another replay.
- The existing homepage also has a localized **Replay introduction** control. It starts a fresh assessment, just like Start assessment. The button is only on the homepage, not in a live report or questionnaire.
- `?intro=off` bypasses the introduction for development on that visit.
- `sessionStorage['career-introduction-v1']` prevents ordinary reloads from replaying during the same tab session. Blocked storage does not prevent entry; persistence across reloads cannot be guaranteed if browser storage is unavailable.
- Skip intro and Escape are optional accessibility conveniences. Playback completes without interaction.

The intro always speaks English; it does not change the saved Chinese/English/Malay application preference. The ten-domain page continues in the user's selected language. Existing V2 questions remain in the supplied Chinese pending reviewed translations.

## Truthful source wording

The actual ledger `data/knowledge/state.json` was checked: O*NET and ESCO each contain five imported records; MYFutureJobs has zero imported records and awaits a permitted import channel. The 14-day update workflow is prepared locally, but activation on GitHub has not been verified and is not claimed.

Scene 4 therefore intentionally changes the requested “regularly refreshed insights” sentence to **“Career and skills intelligence, with dated, source-linked insights.”** Source badges identify the US/EU snapshots and MYFutureJobs permission pending status. A caption says **“14-day refresh workflow prepared; not yet activated.”** These presentation statements must be updated together when source permissions or scheduling actually change; they are not runtime connectivity indicators. No live-ingestion claim is made.

Scene 5 preserves “Test your skills” but labels the experience as exploratory self-report and practice plans, not a certified skills test.

## Implementation

`prototype/intro.js` owns the presentation lifecycle and pure timeline helpers. `prototype/intro.css` isolates its design from the application. Existing `app.js` prepares the V2 direction page underneath the overlay and focuses the selector on completion. The backend's strict same-origin asset allowlist serves these two assets; API behavior and credentials are unchanged.

The introduction now shares the real homepage’s warm-white/sage palette, system font, heavier heading weight, three-circle brand mark, left-aligned copy and mint orbit card. It reads the existing CSS tokens rather than defining a competing dark identity. One persistent orbit illustration contains three familiar task/skills nodes and restrained paths; source labels appear in the data scene. Scene transitions overlap through opacity/transform; the questions stagger. The final dissolve shares the questionnaire’s background color. On narrow screens the illustration becomes a quiet, reduced background ornament, leaving room for the copy. No external fonts, media, animation packages, audio or AI requests are added. A single requestAnimationFrame clock advances the timeline and progress; it pauses on tab visibility changes. All animation, event handlers and overlay DOM are removed after playback. The application is inert only while the overlay is present, and keyboard focus is contained in the dialog. Reduced-motion CSS disables ambient movement and transforms, shortens fades and removes progress movement.

## Verification

- Node tests: 66 passing, including timeline boundaries, automatic first entry, session suppression, explicit replay and denied-storage handling.
- Python tests: 56 passing, including real FastAPI delivery of intro assets under existing CSP and the unchanged deny-by-default asset guard.
- Desktop browser, RunPod credentials explicitly disabled: entry automatically played the sequence, then revealed all ten directions and focused their selector. Completed the DATA questionnaire, generated the local report and opened What If; changing hours from 0.5 to 6 changed the illustrative schedule from 2 to 1 week. The intro did not replay during questionnaire, report, simulator or language changes. English, Chinese and Malay navigation preferences remained usable.
- Screenshot: `docs/evidence/cinematic-introduction.png`.
- Native mobile-device rendering and OS reduced-motion settings have not been browser-tested in this environment; responsive/reduced-motion rules are implemented. 60 FPS is an optimization target, not a measured cross-device guarantee.

Run locally from the repository root:

```sh
.venv312/bin/python -m uvicorn src.career.api:app --host 127.0.0.1 --port 8045
node --test prototype/*.test.mjs
.venv312/bin/python -m unittest discover tests -q
```

## Visual continuity revision

Following feedback that the initial dark launch aesthetic conflicted with the actual site, only `prototype/intro.css` and presentation markup in `prototype/intro.js` were revised. The standalone compass identity and blue/purple treatment were removed. Timing, routing, scoring, source disclosures and assessment behavior are unchanged. The screenshot has been refreshed to show the product-aligned design.
