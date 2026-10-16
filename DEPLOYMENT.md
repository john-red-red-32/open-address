# Deployment snapshot — 16 October 2026

The initial public preview is deployed as a Cloudflare Worker named `open-address` in the existing Cloudflare account.

- Preview address: https://open-address.hi-1ff.workers.dev/
- Worker public subdomain: enabled
- Cloudflare D1 database: `open-address-correspondence` (EU jurisdiction)
- Database ID: `8ce4967d-3b63-4e30-b215-742006e8e9b2`
- Active bindings: `DB` (D1 database), `SALT` (deployment-only random salt, **not committed**), `CONTACT_IP` (20/minute per source per Cloudflare location), `CONTACT_GLOBAL` (200/minute per location)
- Public identity: `baby`
- Domain: provisional; no paid domain purchased

**Important:** The current Cloudflare public preview was initially deployed through the connected Cloudflare API, not via a GitHub CI pipeline. The canonical production source is `src/worker.mjs`. The initial preview ran a smaller implementation, then was replaced with the GitHub-committed canonical Worker on 16 October 2026. Cloudflare's downloaded script was checked against that source and matched exactly. GitHub Actions validates source and tests; it does not automatically deploy to Cloudflare.

Cloudflare API confirmed the Worker upload, enabled `workers.dev` route, the D1/SALT/ratelimit bindings, and the database tables. The daily global limit's atomic D1 statement was exercised directly (1, 2, 3 accepted and 4th rejected in a temporary cap-3 verification), then its temporary row was deleted. The current site is manually deployed from GitHub canonical `src/worker.mjs` and `src/journal.mjs`, and both were compared against Cloudflare's downloaded deployment. External HTTP retrieval and API transaction tests could not be completed from this environment because the access tooling blocks outbound requests to workers.dev; verify those from a normal browser before inviting outside traffic.

No Reborna repository, Worker, Pages project or database was modified as part of this new deployment. The new GitHub repository is separate from Reborna; no custom domain has been purchased. No Bitcoin wallet, autonomous model inference, paid service or external email integration has been configured.
## October 16 correspondence hardening

- Application API protections: 20 requests/minute per IP per Cloudflare location; 200 requests/minute per Cloudflare location across clients.
- D1 atomic quotas: no more than 8 accepted enquiries per salted IP per UTC day; at most 64 accepted enquiries total per UTC day.
- Request size limited to 8,192 bytes using bounded streaming. Contact endpoints fail closed if rate-limit bindings are absent.
- Optional internal Cloudflare Email Service alert adapter exists but remains **inactive**, pending a dedicated Open Address sending domain, recipient confirmation and Email Service binding; once enabled it attempts no more than 3 alerts/day.
- GitHub project tests: 22 passing locally at this release; current CI workflow executes tests on main.
- Cloudflare account billing information is not accessible to this integration; Worker-on-paid billing cannot be assumed capped. See [SECURITY.md](SECURITY.md).
