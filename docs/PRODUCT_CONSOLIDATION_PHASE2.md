# Phase 2 — product consolidation

Checked 23 October 2026 on `codex/recovery-integration-20261023`. This phase kept the recovered product architecture and existing scoring rules. It did not merge to `main`, publish to Replit, change RunPod configuration, or refresh occupational data.

## Integrated flow and provenance

The default **Start assessment** route uses `prototype/combined/app.js`: PR #8 background choices and deterministic report, followed by PR #9's separate V3 4+8 direction questions. PR #11's `deriveResult` and `scenarioResult` adapt that one report for the map and skill tree from PR #6, What If, roadmap, AI context, SDG view and export. `prototype/combined/source-manifest.json` records the original PR #8 engine/catalog and V3 bank hashes. These sources and the score weights were not changed in Phase 2.

The older V2 sample profiles and scripted V0.1 demonstration remain available. The homepage now labels the V2 sample route as **Previous assessment versions**, and its page explains that the current questionnaire starts from the primary button. No legacy answers are converted to V3 answers.

PR #4's unmerged one-file motion variant was reviewed but not copied into the product. Its `MutationObserver` watches additions to `#app`, while its own `decorate()` removes and appends nodes under `#app`. That creates a credible repeated-decoration loop and would also add an independent motion controller around the current intro and combined flow. The branch remains intact for a later scoped visual review.

## Direct fixes

- When a user selects a career other than rank #1, **You & AI** now renders that selected career's task guidance. The career map, skill tree, roadmap and source context already used the selected `focus`; this closes a visible inconsistency without changing the ranking.
- What If now shows a single **Restore original result** control in the shared toolbar when a hypothetical scenario is active. The duplicate control in the scenario form was removed. Reset still discards only the temporary scenario, preserving the original profile and report.
- The V2 sample entrance now identifies itself in English, Simplified Chinese and Malay. The primary route and old sample reports remain available.

## Verification

- Full JavaScript suite: **134 passed, 0 failed**, including all ten V3 directions, three languages, score invariants, scenario isolation, export and the selected-career integration check.
- Python 3.12 `unittest` suite: **61 passed, 0 failed**.
- Local browser journey: completed the four background steps, selected Software & AI Engineering, answered all 12 V3 questions (including one **Not sure / Not applicable**), switched to Malay and back without losing the answer, and opened the offline report. Selecting **Data analyst** was reflected in the map, skill tree and You & AI. Adding **Business** in What If changed Business / operations analyst from 9 to 13 rule points; restoring returned it to 9. Refresh preserved the report and active scenario.
- `git diff --check` and translation JSON parsing passed.

The browser run used fictional choices against a local HTTP server. It did not call RunPod. Export and print remain covered by code-level checks; they were not manually downloaded or printed in this phase. No new mobile viewport pass or production end-to-end check was performed.

## Remaining gates

The default 24-career ranking still uses the PR #8 editorial catalog. O*NET and ESCO links currently add context to only three mapped careers; they do not determine the default score or verified skill gaps. V3 is unverified self-report and does not enter the ranking. Career AI exposure and Malaysian market predictions remain unavailable. Phase 3 should demonstrate one reviewed occupation from official skills/tasks through a reproducible calculation, with explicit user-skill evidence and source provenance, before expanding the mapping. Phase 4 should cover mobile layout, full trilingual browser journeys, export, and a staging release comparison. The exact current Replit publication-to-commit link remains unproven as recorded in Phase 1.
