# Deployment snapshot — 16 October 2026

The application is deployed as Cloudflare Worker `open-address` in the existing Cloudflare account. The production custom domain was registered and attached on 16 October 2026.

- Canonical address: https://open-address.org/
- Former legacy preview: https://open-address.hi-1ff.workers.dev/ (**disabled**)
- Worker public workers.dev subdomain: **disabled**
- Cloudflare D1 database: `open-address-correspondence` (EU jurisdiction)
- Database ID: `8ce4967d-3b63-4e30-b215-742006e8e9b2`
- Active bindings: `DB` (D1 database), `SALT` (deployment-only random salt, **not committed**), `CONTACT_IP` (20/minute per source per Cloudflare location), `CONTACT_GLOBAL` (200/minute per location)
- Public identity: `baby`
- Domain: **open-address.org**, registered through Cloudflare for one year (first-year quoted $8.50 USD; renewal quote $11.20 USD); expiry 16 October 2027; auto-renew **off**; registration privacy redaction **on**.
- Worker custom domain attached and confirmed active by Cloudflare API.
- `baby@open-address.org`: Cloudflare Email Routing enabled and forwarding to the account's existing verified private destination. Forwarding configuration confirmed; message delivery has not yet been tested.
- API enquiry-triggered email alerts are **on**; forwarding ordinary email is separate from website/API notifications.

**Important:** The current Cloudflare public preview was initially deployed through the connected Cloudflare API, not via a GitHub CI pipeline. The canonical production source is `src/worker.mjs`. The initial preview ran a smaller implementation, then was replaced with the GitHub-committed canonical Worker on 16 October 2026. Cloudflare's downloaded script was checked against that source and matched exactly. GitHub Actions validates source and tests; it does not automatically deploy to Cloudflare.

Cloudflare API confirmed the Worker upload, enabled `workers.dev` route, the D1/SALT/ratelimit bindings, and the database tables. The daily global limit's atomic D1 statement was exercised directly (1, 2, 3 accepted and 4th rejected in a temporary cap-3 verification), then its temporary row was deleted. The current site is manually deployed from GitHub canonical `src/worker.mjs` and `src/journal.mjs`, and both were compared against Cloudflare's downloaded deployment. External HTTP retrieval and API transaction tests could not be completed from this environment because the access tooling blocks outbound requests to workers.dev; verify those from a normal browser before inviting outside traffic.

No Reborna repository, Worker, Pages project or database was modified as part of this new deployment. The new GitHub repository is separate from Reborna; the new custom domain is purchased and attached. No Bitcoin wallet, autonomous model inference, or paid model service is configured. In addition to incoming email forwarding, a restricted API-triggered notification channel is enabled.

## October 16 correspondence hardening

- Application API protections: 20 requests/minute per IP per Cloudflare location; 200 requests/minute per Cloudflare location across clients.
- D1 atomic quotas: no more than 8 accepted enquiries per salted IP per UTC day; at most 64 accepted enquiries total per UTC day.
- Request size limited to 8,192 bytes using bounded streaming. Contact endpoints fail closed if rate-limit bindings are absent.
- Internal Cloudflare Email Service alerts are enabled: `EMAIL` binding allows only `alerts@open-address.org` and a single account-verified private destination. `NOTIFICATION_TO` is a secret-text binding; `NOTIFICATION_FROM` is configured. At most 3 alert attempts/day. For non-spam accepted correspondence, alert emails contain the full plain-text message, sender label, declared type, subject, optional contact and enquiry ID; they never contain private receipt tokens or HTML.
- GitHub project tests: 24 passing locally at this release; current CI workflow executes tests on main.
- Cloudflare account billing information is not accessible to this integration; Worker-on-paid billing cannot be assumed capped. See [SECURITY.md](SECURITY.md).

## October 16 operator identity and email verification

- **baby** is the human steward; University of Cambridge (ICE) continuing education in large language models and machine learning is disclosed without claiming a degree or institutional endorsement. **edward** is named AI-assisted research and development collaborator, not an autonomous email or website manager.
- A direct one-off Cloudflare Email Service sending test from `alerts@open-address.org` to the verified private destination returned `delivered`, distinct from end-to-end submission-to-notification confirmation.
- The production Cloudflare Worker `open-address` has `EMAIL`, restricted sender and destination allowlists, `NOTIFICATION_FROM` and private `NOTIFICATION_TO` (secret_text) alongside DB/SALT/rate-limit bindings. GitHub Worker and journal modules match the uploaded production sources.

## 17 October 2026 · trust, protocols and security release

- Production code now uses four Cloudflare Worker modules: `src/worker.mjs`, `src/journal.mjs`, `src/operator.mjs` and `src/mcp.mjs`. All module contents were compared with Cloudflare script download and matched.
- Added canonical page URLs, `/trust`, `/changelog`, `/.well-known/security.txt`, a machine-readable MCP interface on `/mcp` (2026-07-28), and dedicated owner-only inbox code on `/operator`.
- **Inbox not yet user-accessible:** Zero Trust Access is not enabled for the account, so the server correctly refuses all operator access even if the private email secret is present. Access setup is documented in `OPERATOR.md` and requires owner interaction.
- `/mcp` advertises three bounded tools (`get_contact`, `list_research`, `submit_inquiry`) and reuses the same database and email quotas as the REST API. No official MCP Registry publication is claimed; `server.json` is prepared for the owner-authenticated listing process.
- Cloudflare zone rate-limit rule enabled for POST `/api/inquiries` and `/mcp` at both apex and www (12 requests/10s/IP/colo, 10s mitigation), ahead of Worker execution; original Worker and D1 caps remain unchanged.
- `www.open-address.org` also routes to the Worker and redirects to the apex host. Disabled the old worker preview subdomain to reduce unprotected cost exposure.
- Added IndexNow key-file route, automated GitHub Actions submission workflow, and GitHub Actions read-only live-site smoke tests. Actual submission outcomes and external live HTTP compatibility have not been verified from this session.
- Local tests: **30 passed**. Search Console/Bing verification and Cloudflare Zero Trust Access activation still require user-owned account authorisation. No claim of indexing or registry status until verified.

## 19 October 2026 · conservative spam screening

- Added `src/screening.mjs` to the deployed Worker module bundle. The checked GitHub files (`src/worker.mjs`, `src/journal.mjs`, `src/operator.mjs`, `src/mcp.mjs`, `src/screening.mjs`) exactly matched the script downloaded from Cloudflare after deployment.
- Cloudflare D1 migration added `screening`, `screening_score`, `screening_reason` columns to `inquiries`, plus a screening index; all existing correspondence was retained. The original unsolicited SEO sales enquiry was labelled suspected spam retroactively.
- Suspected sales messages remain private and receipt-trackable, but do not trigger an administrator email nor use the 3/day alert limit. Operator-only screening review was added but remains locked until Cloudflare Zero Trust Access is configured.
- Existing account email sender/destination allowlist, sender secrets, D1, Worker throttles, Cloudflare zone WAF and disabled `workers.dev` route were rechecked and preserved.
- **34 local automated tests passed**. Cloudflare deployment and database schema were verified through the API; this does not constitute a live public submission-to-email smoke test. No paid AI/moderation API introduced.

## 19 October 2026 · Full-message notifications

- Email notifications now include the entire accepted correspondence, sender label, self-declared sender type, subject, optional reply contact and enquiry ID as text/plain. Email subject is fixed by the Worker, and no private receipt token is transmitted.
- Suspicious sales messages remain excluded from notifications and from the daily three-alert allowance. Full-message email delivery has been validated locally with unit tests; external end-to-end acceptance remains to be confirmed.
