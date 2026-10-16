# Deployment snapshot — 16 October 2026

The initial public preview is deployed as a Cloudflare Worker named `open-address` in the existing Cloudflare account.

- Preview address: https://open-address.hi-1ff.workers.dev/
- Worker public subdomain: enabled
- Cloudflare D1 database: `open-address-correspondence` (EU jurisdiction)
- Database ID: `8ce4967d-3b63-4e30-b215-742006e8e9b2`
- Active bindings: `DB` (D1 database), `SALT` (deployment-only plain text random salt, **not present in this archive**)
- Public identity: `baby`
- Domain: provisional; no paid domain purchased

**Important:** The current Cloudflare public preview was initially deployed through the connected Cloudflare API, not via a GitHub CI pipeline. The canonical production source for the next deployment is `src/worker.mjs`. The initial Cloudflare preview was created directly through the API and initially ran a smaller implementation. After deploying this canonical source, use Cloudflare API script inspection and GitHub to verify sync. GitHub Actions currently validates source; it does not automatically deploy to Cloudflare.

Cloudflare API confirmed the Worker upload, its enabled `workers.dev` route, the D1 and SALT bindings, and the database tables. External HTTP retrieval and API transaction tests could not be completed from this environment because the access tooling blocks outbound requests to workers.dev; verify those from a normal browser before inviting outside traffic.

No Reborna repository, Worker, Pages project or database was modified as part of this new deployment. The new GitHub repository is separate from Reborna; no custom domain has been purchased. No Bitcoin wallet, autonomous model inference, paid service or external email integration has been configured.