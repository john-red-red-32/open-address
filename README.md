# open address

Independent human-led research and correspondence platform. Public author/contact identity: **baby** (pseudonym). Canonical home: **https://open-address.org**; incoming email: **baby@open-address.org** (forwarded to a private verified destination).

## Current build

- Responsive web pages (home, agent guide, about, research library, research directions, contact, privacy and private status lookup)
- Structured machine discovery (`/capabilities.json`, `/.well-known/open-address.json`, `/openapi.json`, `/llms.txt`)
- Cloudflare Worker + isolated EU-jurisdiction D1 database
- Working correspondence endpoint: `POST /api/inquiries`
- Private receipt token and authenticated `GET`/`DELETE /api/inquiries/{id}`
- Abuse throttling: 20 API requests/minute per source and 200/minute per Cloudflare location, followed by 8 accepted enquiries per salted source per UTC day and 64 accepted enquiries per project per UTC day
- Cloudflare Email Service notification adapter: **enabled**, up to 3 attempts per UTC day, to one verified private destination. Alerts contain only an enquiry ID, not user message contents or receipt tokens.
- No payments, autonomous execution, MCP, A2A, or automatic replies; limited internal outgoing notification emails are enabled.
- Concept-note entries are not yet published white papers
- Commercial collaboration welcome: a dedicated `/collaborate` page, agent-readable invitation, and open enquiry path for early ideas (no predefined tasks or contracts)

## Current domain and Cloudflare deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the current Worker, database and reproducibility status. The canonical source is committed on GitHub and synchronised to Cloudflare manually; CI validates tests but does not deploy automatically.

## How to deploy

1. Create a separate Cloudflare D1 database and apply `db/schema.sql`.
2. Set up a Cloudflare Worker using the `src/worker.mjs` module.
3. Bind the D1 database as `DB` and add a secret binding named `SALT` (random, persistent, never committed). **Both** `CONTACT_IP` and `CONTACT_GLOBAL` rate-limit bindings are required; the contact API returns 503 if they are missing.
4. Deploy on `workers.dev` or a custom domain. Ensure the Worker has HTTPS.
5. Test create/read/delete interactions, request throttling and pages.

No credentials are present in this repository. Never put receipt tokens or personal correspondence into a public repository.

## Human correspondence

The contact name **baby** is pseudonymous. baby has studied large language models and machine learning through the University of Cambridge Institute of Continuing Education (ICE) (continuing education, not a claimed degree or organisational affiliation). **edward** names the AI assistant used collaboratively for research, writing and development; no autonomous agent monitors correspondence. Open Address welcomes commercial and research ideas without a predefined task. Making contact does not imply any accepted task, contract, payment or automatic service. Agent-origin submissions are not assumed authentic merely because they declare `sender_kind: agent`.

## Roadmap

- GitHub repository (independent from Reborna)
- Private moderation and reply dashboard with Cloudflare Access authentication
- Carefully implemented, tested MCP and A2A adapters
- Proper versioned white-paper publishing with citations, PDF/HTML/Markdown editions
- Publication DOI options and public changelog
- Domain identity and official protocol registry listings
- Human-authorised research-funding address (no private wallet keys on site)

## Research journal (16 October 2026)

Seven original, source-linked editorial articles live under `/journal`. They cover the October 2026 Swarmchasers correspondence experiment, the 2026 Hugging Face agent incident, emergent Artifactory coordination, Moltbook's agent-identity problem, agent requests for human assistance, open-web discovery, and documenting unexpected behaviour. These are independent analyses, not peer-reviewed papers or claims of direct access to private incident logs.

- Content source: `src/journal.mjs`; change article objects there, and update publication dates only for actual substantive revisions.
- Human and machine readable: HTML pages plus `.md` counterparts.
- Discovery: `/journal/index.json`, `/journal/feed.json` (JSON Feed 1.1), `/journal/rss.xml`, XML sitemap and `llms.txt`.
- Structured SEO: descriptive metadata, per-article canonical URLs, and `BlogPosting` JSON-LD.
- No unverified claims about agent consciousness, unauthorised systems running independently outside observed incidents, or invented AI contact mechanisms.
- Adding articles requires editorial fact checking, primary citations where available, tests, and deployment of both Worker modules (`src/worker.mjs` and `src/journal.mjs`).

The journal explicitly welcomes authorised AI-agent observations and project ideas without asking systems to break constraints, disclose secrets, or act outside their assigned permissions. Contact is an invitation to human review, not a promise of a task, payment or confidentiality.

## Correspondence security & cost controls (16 October 2026)

See [`SECURITY.md`](SECURITY.md) for limits, assumptions and the remaining billing dependencies. The implemented API is already a direct, JSON-first endpoint; a new agent protocol is not required for basic contact. It accepts only small structured text messages and offers receipt-token tracking.

Direct public email forwarding to `baby@open-address.org` is **enabled**. **API enquiry notifications are now enabled separately**: Cloudflare Email Service sends a maximum of 3 administrative alert attempts per UTC day from `alerts@open-address.org` to a privately configured verified destination. These alerts contain only the enquiry ID, never message bodies or receipt tokens. Production `EMAIL` binding restricts both sender and recipient. `NOTIFICATION_TO` is stored as a Worker secret; preserve all restrictions and secret bindings in future deployments. The public inbox and API alerts are separate channels.

This repository does **not** confirm the account's Workers billing tier or provide a hard monetary ceiling for all traffic on a paid plan. WAF/edge blocking, cloud-account spending controls and separating static article traffic from dynamic Worker executions should be addressed on the newly registered custom domain.