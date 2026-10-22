# MYFutureJobs import boundary

No public API or redistribution permission has been confirmed. This folder intentionally contains **no job listings or market statistics**. Website visibility is not a reuse licence.

After obtaining written PERKESO/SOCSO permission or a published reuse licence, an operator may supply `myfuturejobs.json` on the `career-data` branch. Never include personal candidate/employer data or private permission documents. Keep private correspondence outside the public repository; publish only a suitable official permission reference and reviewer attestation.

Import JSON contract:

- `permission`: `redistribution_allowed: true`, `evidence_url` (official HTTPS URL documenting permitted reuse), `reviewed_by`, `reviewed_at` (ISO date). Merely adding these fields does not confer rights; reviewer must inspect the permission.
- `records`: nonempty array following `Occupation` in `src/career/knowledge/schema.py`. Source must be `myfuturejobs`, geography `MY`, `published_at` mandatory, `license_url` equal to permission evidence. Include original record ID, title, classification, description, version, official URL and a clear licence statement. Skills/tasks/education/trends are separate `Fact` lists.
- A trend observation must identify its period and official URL in `Fact.date` and `Fact.url`, and describe the metric/unit in `Fact.scale`; never infer a trend from undated postings.
- To show a record beside an existing demo career use `classification: "O*NET-SOC contextual mapping"` and its existing SOC ID as `classification_id`. This is an explicitly reviewed contextual link, **not** an official Malaysia–US equivalence. Other records stay in the database but are not silently attached to unrelated recommendations.

Test fixtures use fabricated validation-only records. They are never production imports.
