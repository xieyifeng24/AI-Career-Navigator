# What-if Career Simulator

Available after a real report, on Career paths and Action plan. Uses only that
report's existing paths, work estimates, source links, goals and constraints.
No new AI request, provider cost, backend contract or scoring change.

## Controls and boundaries

- Learning hours (1–40/week): repacks existing work sequentially, splitting or
  combining weekly blocks. Work minutes, deliverables, checks and resources remain.
  Unused capacity in the original schedule is not counted as required work.
- Direction: explores Path A or B already present in the report. The displayed
  score is that role's original score. It does not alter the original ranking.
- First review (1, 2, 4, 8 weeks): shows which work fits and which remains. This is
  an application-readiness review, not a promised employment/start date.
- Priority: balanced goals, personal-interest exploration or salary research.
  The current source snapshot has no pay figures or validated preference model.
  Salary priority therefore changes what to verify first and links the official
  occupational source; it cannot honestly create a salary-based ranking.
- Reset restores the selected report path and original weekly budget. Simulator
  language follows the shared app language while resetting the planning choices.

All schedule estimates assume the report's effort estimates are usable and tasks
can be split. Time does not imply learned skills, certification, suitability or
employability. Prerequisites and real-world constraints still require human review.
Original reports remain below; simulator choices do not overwrite them.

## Language inspection

The integrated application uses the questionnaire branch's shared English,
Simplified Chinese and Malay selector. It controls simulator labels and preserves
scenario choices when switching language. There is no competing simulator selector.
Generated report prose and official source pages keep their original language;
the report-language notice explains when a new analysis is needed.

## Light report refinement

Only adjacent identical sentences, repeated citation IDs in one reference group,
exactly duplicate limitation entries and redundant English week prefixes are
removed at render time. Original report data, caveats, detailed advice, figures,
deliverables and unique official links are retained. Scoring and report structure remain unchanged; the integration only clarifies optional questionnaire context in the existing prompt.

## Validation

Node tests cover score/data immutability, conserved work minutes, budget bounds,
splitting/combining tasks, shorter review windows, both paths, official links,
unsupported salary ranking, three languages, escaped profile text and preserved
report details. Python checks include the new static-module route and existing
API/security tests. Browser UI verification uses an explicitly labelled local
contract fixture (no GPU); the test harness stays in ignored .cache, outside the app.

Run: `node --test prototype/*.test.mjs` and `python -m unittest discover tests -q`.
Start the normal app with the existing Uvicorn command. The feature is local only
until separately approved for deployment; no Replit or RunPod configuration changed.

Verified locally: 27 Python checks and 16 Node checks passed. Chrome checks covered
range-keyboard updates, salary-priority warning, original-score preservation,
shorter review/deferred work, Path B, Chinese/Malay labels, and reset retaining the
selected language. Screenshot `evidence/simulator-local-fixture.png` uses synthetic
contract test data, not a newly generated or verified career analysis.

Integration validation supersedes the historical counts above; see [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md).
