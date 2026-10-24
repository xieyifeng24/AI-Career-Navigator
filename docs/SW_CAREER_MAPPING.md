# Software and AI exploration: reviewed occupational context

This phase changes only the V3 **SW** direction. The other nine directions retain their prior behavior. The current snapshot is `data/knowledge/current.json`; its previous version remains in `data/knowledge/versions/`. The source records were validated with the existing O*NET and ESCO adapters. The snapshot records their individual verification times, release/hash, region, URLs and licence. The SW addition did not reset the 14-day scheduled-check clock.

| Product route | Reviewed context | Relationship and limit |
| --- | --- | --- |
| Software developer (`software`) | [O*NET 15-1252.00](https://www.onetonline.org/link/summary/15-1252.00), [ESCO software developer](https://esco.ec.europa.eu/en/classification/occupation?uri=http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1) | Direct software-development context. The O*NET–ESCO pairing is a team-reviewed contextual link, not an official crosswalk or proof of personal ability. |
| AI / machine-learning engineer (`ai-research`) | [O*NET 15-1221.00](https://www.onetonline.org/link/summary/15-1221.00), [ESCO ICT intelligent systems designer](https://esco.ec.europa.eu/en/classification/occupation?uri=http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8) | Related research and intelligent-systems contexts. Neither record is an exact, comprehensive classification of machine-learning engineering. Do not transfer their US/EU labor-market characteristics to Malaysia. |

The reviewed SW task-to-answer links live in `prototype/combined/sw-analysis.js`. Their source facts have stable IDs in the snapshot:

| Route | Occupational task (O*NET task ID) | Related skill fact | V3 signal | Interpretation |
| --- | --- | --- | --- | --- |
| Software | Develop or modify systems (21667) | ESCO develop software prototype | SW01 | Interest in building; the question does **not** test the task's mathematical content. |
| Software | Correct software errors (21670) | ESCO debug software | SW02 | Interest in investigating faults, not observed debugging skill. |
| Software | Develop validation/testing procedures (21669) | O*NET Systems Evaluation, importance scale | SW04 | Preference for iteration, not observed test quality. |
| Software | Analyze user/software requirements (21662) | O*NET Systems Analysis, importance scale | SW03 | Indirect link from preference to break work into testable steps; no requirements-analysis proficiency inferred. |
| Related research | Analyze computing problems (14623) | O*NET Complex Problem Solving, importance scale | SW03 | Transferable problem-structuring preference only. |
| Related research | Formulate mathematical models (14629) | O*NET Mathematics, importance scale | **Unmeasured** | Ask for a worked mathematical/modeling sample. |
| Related intelligent systems | Explore new technology (14626) | ESCO principles of artificial intelligence | **Unmeasured** | Ask for an AI/ML concept and evaluation sample. |

The pairing of a V3 statement with a source task is a **team product inference**. The task and skill text, identifiers and dates are source facts; their relevance to this user's answer is not an official endorsement. ESCO provides occupation–skill links; the task text here comes from O*NET. AI assistance descriptions are qualitative team scenarios, not source claims about automation rates.

For each linked V3 task preference, 5–7 contributes one supporting sign, 1–3 one non-preference sign, and 4/unknown contributes none. No reverse-scoring metadata is present in the V3 bank. The signs are a transparent task-affinity ledger, **not** an aptitude score. The two unmeasured core research links create an uncertainty margin. Software is prioritized only when its net direct signs exceed the related research route by more than that margin. Otherwise both routes are shown at the same exploratory priority. Self-reported SW05/SW06 experience, G03/SW07 AI use, and G04/SW08 verification are analyzed separately and select appropriate validation tasks; they never become verified skills or machine-learning suitability. This rule covers only two routes within SW, not all 24 catalog careers.

The shared V3 analysis is attached as `report.p0Analysis`. Its route reasons, source IDs, requirements and actions feed the visible career comparison and the existing star-map/skill-tree report paths. SW What If uses the same route action for its baseline and changes only the conditional practice step; it does not claim a recalculated career ranking or newly acquired skill. SDG companions remain independent background-interest context.

Known limits: the questionnaire does not directly ask about mathematics, statistics, data preparation, ML evaluation, actual code quality or local hiring conditions. It cannot establish professional readiness. The current MYFutureJobs adapter still has no approved public import, so no Malaysian market forecast is inferred. The legacy V2 engine and the other nine V3 directions are deliberately unchanged.
