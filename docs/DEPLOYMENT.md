# Anonymous-access update

The current candidate removes the team password. Keep the existing RunPod secrets
and endpoint unchanged. Existing DEMO_ACCESS_CODE can remain in Secrets but is
ignored. Existing SESSION_SECRET may sign anonymous cookies. Use one instance and
one process; see ACCESS_CONTROL.md for caps, disk persistence and proxy limitations.
Previous access-code instructions below are historical.

# Current release

Production is now Autoscale and accepted. See RELEASE.md for the actual result.
The owner explicitly approved the required Static unpublish operation and its
history/domain risks; the domain was retained. Code rollback branch remains.
The runbook below includes historical pre-release notes. Do not restart repeated
GPU quality optimisation as a condition of this delivery.

# Replit release runbook and rollback

Target only the existing project:
https://replit.com/@xyf20070924/AI-Career-Navigator

Production URL:
https://ai-career-navigator-xyf20070924.replit.app/

As audited on 21 October 2026, production is **Static**, North America, public,
serving V0.1. Local Replit release commit: `cc8efba`. Core prototype commit:
`7db7c84a785165a6e8195f2ec579be4e925dca4d`. These are the rollback references;
confirm current status again immediately before any release.

## Candidate preparation

1. Complete RunPod setup in `runpod/README.md`; record current pricing and obtain
   owner approval before paid resources. No keys in Git or chat.
2. Run basic offline checks. Following the owner’s release instruction, perform
   one real end-to-end acceptance on production; record non-blocking advice issues
   in KNOWN_ISSUES.md instead of delaying release for repeated GPU evaluation.
3. Deploy the exact feature-branch SHA to the existing project. Main remains
   protected; PR review can proceed independently of the hackathon release.
4. In Replit Shell, inspect `git status` and preserve the current release with a new
   local backup branch. Do not overwrite uncommitted work. Fetch GitHub and check
   out the reviewed exact candidate SHA on a new branch. No force push/reset.
5. Install `uv venv .venv-replit && uv pip install --python .venv-replit/bin/python -r requirements.txt`. Configure Replit **Secrets**:
   `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, `RUNPOD_MODEL`, `DEMO_ACCESS_CODE`,
   `MAX_DAILY_ANALYSES=20`. Do not expose these through screenshot/debug output.
6. Start `sh scripts/replit_start.sh`.
   Verify the development preview and all required pages. Configuration health is
   not a model health test; generate a real report.

## Production release gate

- Offline CI green, exact release SHA recorded, source feed live.
- RunPod configured; model disclosed; basic contract/security checks pass.
- Real inference required, no accidental scripted fallback. One production journey is the acceptance check.
- Current production configuration/screenshots and rollback branch retained.
- Owner explicitly requested immediate release on 21 October 2026; existing budget and rollback points retained.

Then switch Publishing from Static to **Autoscale** in this same project. The
candidate `.replit` uses `deploymentTarget="cloudrun"` per Replit documentation.
Build: `uv venv .venv-replit && uv pip install --python .venv-replit/bin/python -r requirements.txt`. Run command as above. Port 8000,
one instance/worker for the prototype's in-process concurrency/quota controls.
Keep the existing domain; confirm the Publishing UI allows the type change without
losing it. If the UI requires deleting the existing deployment, stop for review of
the downtime/domain consequences rather than deleting it blindly.

Publish only after the gate. Open the public URL, inspect health, refresh sources,
complete the primary flow and both paths, repeat with changed skills/hours, and
capture dated screenshots. Record actual deployment/release SHA in EVIDENCE.md.
A publish button click is not proof of a successful release.

## Rollback

Prefer Replit's previous deployment rollback if available. Otherwise select the
preserved V0.1 release branch/commit, restore Static publication with `prototype`
as public directory, and verify the same public domain. Do not rewrite GitHub
history. Turn off/scale down unused RunPod workers to prevent unintended usage;
check account usage, without assuming that a frontend rollback stops GPU billing.

## Replit dependency runtime

The actual workspace provides uv 0.9.5 and an externally managed Nix Python 3.12.12.
System pip installation is rejected; even `python -m venv` inherits a user-install
setting. Use the verified uv virtual environment instead of weakening system protection.
`.venv-replit/` is ignored by Git.

## Current blockers

RunPod endpoint is provisioned and an endpoint-restricted key is stored locally.
The owner approved up to US$2 in live evaluation. The short real-model smoke
request passed; Replit Secrets are configured; full report evaluation is in progress.
Candidate has not been published over production. Retaining the
working demo is intentional until the release gate is satisfied.

References: https://docs.replit.com/features/project-setup/configuration and
https://docs.replit.com/features/publishing/deployment-types
