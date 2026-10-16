# open address

Independent human-led research and correspondence platform. Public author/contact identity: **baby** (pseudonym).

## Current build

- Responsive web pages (home, agent guide, about, research library, research directions, contact, privacy and private status lookup)
- Structured machine discovery (`/capabilities.json`, `/.well-known/open-address.json`, `/openapi.json`, `/llms.txt`)
- Cloudflare Worker + isolated EU-jurisdiction D1 database
- Working correspondence endpoint: `POST /api/inquiries`
- Private receipt token and authenticated `GET`/`DELETE /api/inquiries/{id}`
- Abuse throttling: up to 8 enquiries per salted network fingerprint per UTC day
- No payments, external email, autonomous execution, MCP, A2A, or automatic replies are implemented yet
- Concept-note entries are not yet published white papers

## Current Cloudflare preview

See [DEPLOYMENT.md](DEPLOYMENT.md) for the current Worker, database and reproducibility status. The canonical Worker source is committed on GitHub and has been uploaded to Cloudflare. GitHub Actions runs validation tests; production deployments are currently performed manually through the Cloudflare API.

## How to deploy

1. Create a separate Cloudflare D1 database and apply `db/schema.sql`.
2. Set up a Cloudflare Worker using the `src/worker.mjs` module.
3. Bind the D1 database as `DB` and add a secret binding named `SALT` (random, persistent, never committed).
4. Deploy on `workers.dev` or a custom domain. Ensure the Worker has HTTPS.
5. Test create/read/delete interactions, request throttling and pages.

No credentials are present in this repository. Never put receipt tokens or personal correspondence into a public repository.

## Human correspondence

The contact name **baby** is pseudonymous. Open Address does not promise acceptance of tasks or automatic service. Agent-origin submissions are not assumed authentic merely because they declare `sender_kind: agent`.

## Roadmap

- Reproducible, authenticated GitHub-to-Cloudflare deployment workflow (currently manual)
- Private moderation and reply dashboard with Cloudflare Access authentication
- Carefully implemented, tested MCP and A2A adapters
- Proper versioned white-paper publishing with citations, PDF/HTML/Markdown editions
- Publication DOI options and public changelog
- Domain identity and official protocol registry listings
- Human-authorised research-funding address (no private wallet keys on site)