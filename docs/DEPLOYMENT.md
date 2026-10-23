# Replit deployment and version tracking

Current audit: 23 October 2026. Production is [Live](https://ai-career-navigator-xyf20070924.replit.app/) on the existing [AI-Career-Navigator Replit project](https://replit.com/@xyf20070924/AI-Career-Navigator), with public Autoscale in the Asia region (1 vCPU, 0.5 GiB). The release shown in Replit publish history is b1677f91. This document replaces the earlier Static-to-Autoscale instructions, which remain available in Git history.

## Source currently observed

GitHub main (5bdb965) contains the SDC submission scaffold. The reviewed product candidate is 63a3fbb on codex/unified-career-results, under Draft PR #11 stacked on Draft PR #10. The Replit workspace is on release/unified-results-20261022 at 5d26943. Its first parent is f4a89cd, which only preserves Replit runtime packages in .replit; the product parent is 63a3fbb. A file diff from the workspace HEAD to 63a3fbb shows only .replit.

The live site served five public assets with hashes identical to 63a3fbb, including the result adapter and data/knowledge/current.json. This is stronger evidence than a visual comparison. Replit's publish view does not disclose the complete Git SHA used for b1677f91, so do not claim that its exact deployment commit has been proven. Full audit and hashes: [Phase 1 version recovery](VERSION_RECOVERY_PHASE1.md).

The existing .replit runs sh scripts/replit_start.sh, which starts src.career.api:app on port 8000. Its deployment build creates .venv-replit with uv and installs requirements.txt. The Replit-only configuration currently includes nodejs-20, python-3.12, cacert, git, and libxcrypt. Do not replace it with the leaner GitHub .replit file during a release without testing the runtime difference.

## Reviewed release procedure

1. Choose an exact reviewed Git commit and record the PR, source SHA, test results, and knowledge snapshot version. Keep open branches and previous publish history.
2. In the existing Replit workspace, check git status and create a backup branch at the current HEAD. Phase 1 created backup/phase1-current-live-20261023 at 5d26943; backup/before-unified-results-20261022 and older branches also remain. Do not reset or overwrite uncommitted work.
3. Create a separate release branch from the reviewed source SHA. Carry forward only the necessary Replit runtime configuration, and record its file diff. Do not put credentials in Git. Preserve existing server-side RunPod Secrets and endpoint configuration.
4. Verify the development preview or a separate test deployment first: start command, public assets, four-step choices, 12 V3 questions, local report, map, tree, What If reset, roadmap, export, and three languages. Basic reports must work with the optional AI service unavailable. Run the existing Python and JavaScript suites.
5. For a production release, use the existing Autoscale project. After publication, verify the public URL, release history ID, visible content, and production health. Run the exact comparison command below against the reviewed checkout. Record the results and any Replit-only commit in a dated release record. A successful publish click alone is not acceptance.

~~~sh
python scripts/verify_live_assets.py --url https://ai-career-navigator-xyf20070924.replit.app
~~~

The checker reads only five allowlisted public files. It neither calls RunPod nor reads Secrets. A future reviewed build should expose a release manifest with the source SHA, configuration SHA, and knowledge version. Until that is deployed, public asset matches and Replit publish history are the available provenance evidence.

## Security and rollback

Keep RUNPOD_API_KEY and other sensitive settings in Replit Secrets or a local ignored .env. DEMO_ACCESS_CODE is no longer used by the current anonymous-access path; existing rate and concurrency limits still protect paid inference. Never print Secret values in logs or release evidence. Keep the default local assessment independent of RunPod.

If a new release fails, prefer Replit's previous deployment rollback and verify the restored public site. The workspace backup branch lets maintainers recover its source and runtime configuration. Rolling back browser code alone does not necessarily stop or refund RunPod usage; check provider usage separately. Do not delete Git branches or Replit release history as a cleanup step.

This Phase 1 audit did not republish, alter Secrets, change the RunPod endpoint, merge GitHub main, or run a paid GPU request.
