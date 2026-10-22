# Anonymous AI access — 21 October 2026

## Audit

The old form collected `Team demo access code` in `prototype/app.js`.
`prototype/live.js` sent it as `X-Demo-Code`; `src/career/api.py` compared it
against the server's `DEMO_ACCESS_CODE` for both paid routes and polling.
It was a shared GPU-use gate, not an account or the RunPod credential.

The maintainer's ignored `.env` contains a non-empty code. A private local
instruction file also exists under `.cache/demo-access.txt`. Earlier deployment
configured the code in Replit development and production Secrets. `.env.example`
contained only an empty placeholder, so cloning GitHub could not reveal it.
No code was missing locally, and no replacement shared password was generated.
Private values are deliberately absent from this audit.

## Replacement

1. The browser automatically calls `GET /api/session` before submitting.
2. The server issues a signed, 24-hour, HttpOnly, SameSite=Strict cookie (Secure
   on production HTTPS) and a session-bound CSRF token. No user-entered code.
3. Paid POSTs require that cookie, a matching CSRF header and the app's Origin.
   This prevents cross-site drive-by calls, not determined automated clients.
4. Both `/api/analyze` and `/api/analyses` share one quota reservation and
   concurrency guard. Merely getting a new cookie cannot bypass the IP limit.
5. A result is readable only by its owning session and expires after 30 minutes.
6. `synthetic: true` remains mandatory in the server contract and UI confirmation.

`DEMO_ACCESS_CODE` and `X-Demo-Code` are no longer used. Existing private config
may remain untouched. SESSION_SECRET, if configured, stays server-side. Otherwise
an internal signing key is stored privately beside the quota ledger; it is not a
new human password. RunPod model, endpoint, worker settings and API key are unchanged.
RunPod is called only by the backend. No secret is shipped in JavaScript or health.

## Default paid-call protection

| Scope | Limit |
|---|---|
| Shared service | 20 starts per rolling 24h; 10 per hour |
| Each network/IP AND each signed session | 3 starts per hour; 6 per rolling 24h |
| Cooldown per IP AND session | 60 seconds |
| Concurrent generation | 1 |
| Output | Existing 6,500-token maximum |

Limits are environment-configurable with conservative upper bounds in access.py.
Rejected requests return 429 with Retry-After. Failed upstream attempts still count
because the provider may have charged or continued execution. Restarting a process
on the same disk does not erase the SQLite ledger. If the ledger cannot be written,
paid generation fails closed; it never silently becomes unrestricted.

Only timestamps and keyed hashes of peer IP/session identifiers are written to
`.cache/runtime/inference-quota.sqlite3`; no profiles, reports or raw IPs. The static
asset whitelist does not serve this directory. LIMIT_STATE_DIR can point to an
existing persistent writable mount; no new external database/service is provisioned.

Keep Replit at one instance / one Uvicorn worker. A new ephemeral filesystem or a
second independent instance has a separate ledger: these are application limits,
not a hard provider billing cap. Continue checking provider credits/spending controls.
Do not trust raw caller-provided X-Forwarded-For. The limiter uses ASGI request.client;
operators must validate the hosting proxy configuration. If it exposes one proxy IP,
visitors share a conservative network limit; do not bypass it by trusting arbitrary
headers. Distributed bots can consume the shared allowance but cannot exceed that
ledger's reservation ceiling. Stronger public anti-bot controls/shared storage can
be added later if traffic warrants them.

## Verification

Offline tests cover anonymous success, absent/tampered session and CSRF rejection,
cross-origin rejection, owner-only results, mandatory fictional consent, session/IP
limits, new-session bypass attempts, atomic global ceilings and restart persistence.
They use labelled synthetic provider fixtures and spend no GPU credits.
