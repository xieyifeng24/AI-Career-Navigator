# PR #8 + PR #9 questionnaire integration

Branch: `codex/integrate-pr8-pr9`. Base: PR #9 (`ca3cd48`); imported PR #8 (`b8a7610`).

## Approved behavior

The existing landing page and introduction lead into PR #8 background selections, then PR #9 V3 questions (4 common + 8 selected-direction questions). Reports use the unchanged PR #8 deterministic engine. V3 answers are displayed and exported as separate, unverified self-report and never affect ranking. No new V3 scoring rules are introduced.

English, Simplified Chinese and Malay share ID-based answers. The combined flow has its own session-storage namespace; refresh restores progress. V2 letter answers are never migrated. Original V3 questions/translations are unchanged. Imported source hashes are recorded in `prototype/combined/source-manifest.json`.

## Retained routes and limits

- Default `/`: existing introduction + combined questionnaire and PR #8 reports.
- `/?assessment=v3&intro=off`: standalone V3 phase-one preview.
- `/?assessment=offline&intro=off`: original PR #8 experience.
- `/?assessment=v2&intro=off`: retained V2 reports, What If and official O*NET / ESCO / MYFutureJobs references, linked from the combined flow. What If does not consume the new combined answers yet.

Neither the combined questionnaire nor its report calls generative AI. The original backend, RunPod configuration and official-data integrations are preserved. PR #8 career rankings remain editorial exploration rules, not official labor-market predictions.

## Verification

125 JavaScript tests and 59 Python tests passed. New tests cover all 10 directions, all 3 languages and low/high/unknown V3 responses; identical background data always produces identical PR #8 rankings. Storage/version isolation, refresh and invalid drafts are tested. Browser verification completed background choices, 12 V3 answers including unknown and the resulting report with RunPod disabled.

## Deployment

Use the existing Replit project and Autoscale configuration. Preserve a cloud backup branch and its Nix runtime dependencies. Do not merge GitHub main. Production URL and release revision are recorded after publication.
