# Phase 1 — version recovery and source audit

Audited 23 October 2026. Scope: identify and protect the running product, map the open PRs, and create a safe integration baseline. No production deployment, branch merge, RunPod request, secret change, or data refresh was made during this phase.

## Authoritative observations

| Surface | Observed state | Evidence and limit |
|---|---|---|
| GitHub main | 5bdb965, the SDC template and team CI scaffold | It has no prototype/ directory, data/knowledge/ snapshot, or src/career/ product package. This directly explains why the repository front page still looks like the template. |
| Best recovered product base | 63a3fbb on codex/unified-career-results, Draft PR #11 stacked on Draft PR #10 | Contains the default combined questionnaire, 24-career rule report, map, tree, What If, roadmap, SDG view, export, the older API, and bundled knowledge snapshot. Selected because of working flow and verified coverage, not commit date. |
| Replit workspace | release/unified-results-20261022 at 5d26943; clean, two commits ahead of 63a3fbb | Commit f4a89cd preserves Replit runtime packages; 5d26943 is a Replit “Published your App” checkpoint. Diff to 63a3fbb changes only .replit. Run command is sh scripts/replit_start.sh, serving src.career.api:app on port 8000. |
| Replit production | Live Autoscale at https://ai-career-navigator-xyf20070924.replit.app/; publish history ID b1677f91 | Replit publish view showed a successful build and Live status. It did **not** expose a complete source Git SHA. Therefore the workspace lineage is proven, while the release-to-commit link is not yet cryptographically proven. |
| Public files | Five fetched files matched the 63a3fbb checkout by SHA-256 | Combined result adapter, combined controller, rule engine, intro, and knowledge snapshot matched. This supports that the active site serves this product generation; it is not a full deployed-filesystem proof. |

The public asset hashes were:

| Path | SHA-256 |
|---|---|
| combined/results.js | 53fcc7afa19c5e09be5c56e7cde409947ebca4cb2f535c9fa3e78b9e4058f736 |
| combined/app.js | 68a9c5c738514a520099ab9751bd9bc317aa637130d46244499f22a433c12464 |
| explorer-engine.js | a9a660e6c807d1834644fc4a0f3ae692748eb7c4347d28b69af4422d2b1bb8e3 |
| intro.js | a12c856e3c7f606393543eaed5b23d5125f5a6271f0aec87f60e701e035b26fc |
| data/knowledge/current.json | 86fc7ee97b6696ded0ca2c596f6528db80f04e01dd83130b36e2998049686d07 |

Run scripts/verify_live_assets.py against a public staging URL or the known production URL to repeat this focused comparison. Future releases need an explicit build manifest with both the reviewed source SHA and Replit-only configuration SHA. This phase does not claim that such a manifest is already deployed.

## Protection and integration workspace

The original local checkout was on codex/cinematic-introduction at 5a43eb7 with one modified document and three untracked files (a workbook and two evidence files). Those files were not altered. A byte-preserving backup of the tracked patch and untracked files, with hashes and a status manifest, is in the original checkout's ignored .cache/version-recovery-20261023/ directory. This archive is local and is not a substitute for a team-owned off-machine backup.

Local backup refs:

- backup/version-recovery-main-20261023 → 5bdb965
- backup/version-recovery-product-20261023 → 63a3fbb
- codex/recovery-integration-20261023 → independent worktree based on 63a3fbb

The existing Replit workspace already had backup/before-unified-results-20261022. A further branch, backup/phase1-current-live-20261023, was created at its clean 5d26943 checkpoint. Replit's older publish history remains present. No branch was deleted or force-pushed.

## PR and feature provenance

The public GitHub API listed nine open PRs (#2, #3, #4, #5, #6, #8, #9, #10, #11) and merged PR #1 at audit time. Branches were fetched before comparison.

| PR / branch | Relevant work | Current product relationship |
|---|---|---|
| #1 team workflow | Submission scaffold, team CI | Merged into main. |
| #2 interactive prototype | Landing, scripted demonstration, base UI | An ancestor of the recovered product. |
| #3 real AI MVP | FastAPI, source-based five-role matching, protected RunPod flow | Code retained. The default combined questionnaire does not call this matching engine or RunPod. |
| #4 frontend growth motion | One-file prototype/index.html visual/motion change | Separate unmerged branch. It is not the default product's current HTML; compare visually during Phase 2 before selective reuse. |
| #5 questionnaire i18n | Choice inputs and three-language infrastructure | Ancestor of the recovered product. |
| #6 career star map | Constellation, skill DNA, roadmap visual components | Branch diverged; the recovered product contains adapted map/tree renderers driven by shared results. Do not blindly merge its older report contract. |
| #8 offline career + SDG | 24-career catalog, deterministic background-choice scoring, learning plan, SDG companions | Branch diverged; its engine and catalog were selectively imported into #10, with source hashes recorded in prototype/combined/source-manifest.json. |
| #9 local-first / intro / V3 | Six-scene intro, trilingual 4+8 question bank, local-first modules | Ancestor of #10/#11. The V3 answers are currently isolated self-report, not scoring inputs. |
| #10 PR8+PR9 integration | Background-choice form + V3 questions + PR8 report | Ancestor of #11 and the current Replit source lineage. |
| #11 unified results | One result adapter for map, tree, What If, roadmap, export | Current best base, with 132 JS and 61 Python tests passing. |

Additional local development branches (local-first assessment, dynamic career database, V2 questionnaire, cinematic intro, hackathon integration, What If) are ancestors of this base. Branch history is retained; feature presence is checked through code and tests, not assumed from ancestry alone.

## Current feature inventory and P0 findings

The main Start Assessment route uses prototype/app.js → prototype/combined/app.js. It preserves the intro; PR8 background choices; V3's 10 directions, 4+8 seven-level questions and unknown option; a deterministic report; 24-career map; skill tree; What If; four-week learning plan; SDG companions; three-language assessment; and JSON/print export. Older V2, scripted, and source-based routes still exist and must remain distinguishable during consolidation.

The default ranking in prototype/explorer-engine.js calculates points from selected interests (4 each), relevant major (6), school stream (2), mindsets (2 each), and AI use purposes (1 each), with catalog order breaking ties. These are editorial exploration rules. The V3 numeric answers do not affect ranking. In prototype/combined/results.js, the knowledge snapshot is read **after** generateOfflineReport and selected source records are appended to three contextual career mappings. Thus O*NET/ESCO facts are currently displayed but do **not** enter that default score. Skill requirements come from the editorial 24-career catalog; baseline skill gaps and AI readiness scores are explicitly unavailable. What If rescores supported background choices through the same engine, but assuming a skill does not raise a match score; study time changes the plan only.

The older src/career/matching.py does use source-role skills, tasks, and published growth categories for five roles through /api/match and optional AI analysis. prototype/local/engine.js also contains a separate source-aware report path. Neither is the current combined default scoring path. These are the first reuse candidates for Phase 3, subject to compatible user-skill evidence and reviewed career IDs. No automatic conversion of V3 self-ratings into verified skill proficiency is justified.

The bundled knowledge snapshot version is knowledge-20261022T034523Z-c11ab1d3c9fdc2bb: five O*NET US occupation records, five ESCO EU records, and zero MYFutureJobs market records. The sync code and an approximately 14-day due check exist, but the GitHub scheduled workflow is inactive while outside main. No source-backed occupational AI exposure measure or Malaysian employment forecast is available in the default report. Do not describe those as calculated.

## Verification and next gates

- Recovery worktree starts clean at 63a3fbb. Node tests: 132 passed, zero failed. Python 3.12 virtual environment: 61 passed, zero failed. The system Python 3.14 lacks project dependencies; its import errors were an environment issue, and the correct interpreter passed.
- Replit workspace was clean at 5d26943. Its start and deployment commands were read from .replit. Current release was Live. The five public asset comparisons above passed.
- No full new browser journey, GPU inference, cron execution, or source-to-score validation was claimed in Phase 1.

Phase 2 should compare the unmerged #4 visuals and #6 legacy behavior against the recovered flow, then resolve duplicate entrances and labels without changing scoring weights. Phase 3 should validate one occupation end to end with a stable career-ID crosswalk, official task/skill provenance, explicitly elicited user skill evidence, deterministic score and gap calculations, and source-limited AI impact statements. Phase 4 should verify the full journey and three languages. Only after review and a test deployment should a product PR advance toward main and a release manifest be attached to a Replit publication.
