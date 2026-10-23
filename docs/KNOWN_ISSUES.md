# Release candidate known issues

- Small-model career guidance is exploratory and can repeat wording or make weak
  role/skill interpretations. Self-reports are not verified competence.
- Some claim citations support general context rather than the exact advice.
  Learning-resource links come from the approved catalogue independently of claim
  citations; users should check relevance and current free access.
- US occupational projections are not Malaysian labour-market forecasts. arXiv
  signals are early research, not evidence of hiring demand or adoption.
- GPU cold starts can take several minutes. The UI provides loading, cancellation
  and retry; cancelling the browser wait may not cancel provider execution.
- Anonymous sessions, one concurrent analysis and server-side quotas protect
  limited GPU credits; this is a single-instance hackathon release.
- Existing scripted V0.1 is accessible only through its explicitly labelled demo
  entry. It is never substituted for a failed real inference request.

Release acceptance: the existing public site accepts a fictional profile, calls
RunPod and displays a readable structured report. Stylistic imperfections and the
above exploratory limitations do not block release. No repeated five-case GPU
evaluation is required for this delivery stage.

Observed in the accepted report: some summary text ends abruptly; a role explanation
or tool-purpose sentence may not match its heading exactly. These are recorded
content limitations, not release blockers. Refreshing the browser loses its current
report; restarting the single backend instance also expires pending jobs/results.

Anonymous quotas use local SQLite. They survive process restarts on the same disk,
but a replacement Replit deployment/instance may have fresh storage. Limits are not
a hard dollar-spend guarantee. Networks sharing one apparent IP share its allowance.

Integration candidate: some extended explorer explanatory copy retains English
fallbacks in Chinese/Malay UI. The shared questionnaire, original report interface,
What-if controls and new explorer navigation/core headings support all three.
Source-only candidate C has no generated AI plan and cannot be used to invent a
What-if schedule; its separate exploration exercise is explicitly labelled.
