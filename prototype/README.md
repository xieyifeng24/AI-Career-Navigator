# Frontend

The existing HTML/CSS/ES-module visual design is preserved. No frontend build tool
is required. Start the full app with the Python 3.12 commands in the root README.

- `app.js`: navigation, four-step fictional profile, consent, loading, errors, and cross-view selection state.
- `live.js`: API boundary, safe report rendering, public source and matching views.
- `career-explorer.js`: source-aware career comparison, the radial Skill DNA workspace, and an exploratory plan for an extra source-ranked route.
- `star-map.js` / `star-map.css`: default post-assessment career map and route detail.
- `career-explorer.css`: responsive comparison and Skill DNA workspace styles.
- `logic.js`: form validation and explicit legacy demo assembly.
- `data.js`: two fictional scripted V0.1 cases with three illustrative routes each, never imported by the backend.
- `styles.css`: shared responsive visual system.

After assessment, users start on the career roadmap and choose a route before its action plan unlocks. The plan introduces Skill DNA, whose radial graph uses only the report's profile skills, route matches and reported gaps. Marking a step as practiced is a session-only user note, not a proficiency assessment. The first two routes in a live analysis are model-generated paths. A third route may come from source-based matches and is labelled as an additional candidate without full AI path analysis. Time Machine and SDG Mapper have been removed from the product navigation.

The scripted marketing case includes one sourced SDG 8.2 example: an O*NET market-research task is shown as a possible enabling relationship to productivity/innovation, with the UN goal link. It is explicitly an illustrative hypothesis, not measured impact, a UN endorsement, or Malaysia-specific labor-market evidence. Other demo routes show no SDG link unless one is separately supported.

The landing page exposes live-source matching and real-AI analysis separately.
“Open scripted V0.1 demo” is the only intended route to the old mock reports.
There is no automatic fallback from a failed model request.

`python3 prototype/server.py` remains available as an offline static preview at
port 4173. Only the explicitly selected scripted mode works without the API;
public source and real AI features require `src.career.api:app` on port 8000.

Frontend checks: `node --test prototype/logic.test.mjs`.
