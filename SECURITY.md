# open address — correspondence and billing audit

Updated 16 October 2026. This document describes safeguards **implemented in code**, with separate notes about account controls we cannot verify through the current integration.

## Existing public API

`POST /api/inquiries` accepts text-only JSON (sender, declared type, subject, message, optional reply contact). Accepted messages are stored privately in the EU-jurisdiction Cloudflare D1 database. The requester receives a one-time receipt token; only a salted hash of that token is stored. `GET` and `DELETE /api/inquiries/{id}` require the matching Bearer token. The service has no arbitrary task execution, paid model calls, outbound requests to user-provided URLs, or wallet integration.

## Safeguards

- Application-level per-location Cloudflare Rate Limiting API bindings, both **mandatory**: `CONTACT_IP` 20 API requests/minute per source IP and `CONTACT_GLOBAL` 200 API requests/minute per Cloudflare location. These counters are approximately consistent and location-local; they are **not global hard caps**.
- D1 accepted-enquiry ceilings, enforced atomically across all traffic: 8 accepted submissions per salted source IP per UTC day, 64 accepted submissions project-wide per UTC day, regardless of IP rotation. After reaching the cap, the API returns 429. A denial may still cost a Worker invocation or a small D1 query.
- Maximum 8,192 bytes per JSON submission, read as a bounded stream; maximum 4,000 characters for the message. Content-Type validation and restricted fields.
- Email notifications are enabled with three server-side settings (`EMAIL` send binding, verified `NOTIFICATION_TO` and `NOTIFICATION_FROM`). At most **3** notification attempts per UTC day. Recipient and sender cannot be chosen by the request. The email **subject remains fixed and is never caller-controlled**; its plain-text body contains the accepted sender label, declared type, subject, full message (maximum 4,000 characters), optional reply contact and enquiry ID. No receipt tokens, HTML or attachments are sent. The operator's destination mailbox remains a private allowlisted Worker binding.
- Missing rate-limit bindings fail **closed** (503) for the correspondence routes.
- Daily limit table holds derived fingerprints, not raw IPs; project quota entries and notification counter live in the same existing table.

## Cost and operational boundaries

Cloudflare's Workers Free plan currently documents 100,000 requests/day, and D1 Free plan enforces daily rows-read/written usage quotas. A paid Workers account instead has metered usage; **we cannot confirm which plan is active** using the connected API token. Rate limiting *within* Workers protects D1 but does not stop billable Worker invocations on a paid plan. Cloudflare WAF edge limits are unavailable on the provisional `workers.dev` subdomain; they should be applied to a dedicated domain before scaling publicity. Separating journal static pages onto Pages (static asset responses) would reduce Worker exposure further.

Cloudflare Email Service is now configured with the project's sender (`alerts@open-address.org`) and one account-verified private destination. The production email binding restricts both sender and destination. A one-off email test through Cloudflare's sending API returned `delivered`; live submission-to-inbox delivery has not been independently tested end-to-end. Cloudflare documents verified-destination sends as free.

## Further hardening before larger-scale publicity

1. Confirm Workers account plan and enforce account-level spending alerts/budgets where available; do not interpret an alert as a guaranteed cap.
2. Email binding has already been restricted to an approved sender and a verified private destination. Preserve allowlists and `NOTIFICATION_TO` secret on any future deployment.
3. Confirm that a genuine API submission triggers delivery and creates a private stored correspondence record; alerts fire only on accepted submissions, not reads/errors.
4. Provision the private inbox with Cloudflare Access or another audited authentication system; never publish admin tokens or rely on client-side hiding.
5. Once a custom domain exists, add edge WAF/rate-limit rules for `/api/inquiries*` so abusive traffic is blocked *before* Worker invocation, and consider splitting static pages onto Pages.
6. Add database retention/cleanup policy for daily-limit fingerprints and future archival; avoid deleting research correspondence without defining retention.

No test, deployment, or application rule can guarantee that a malicious distributed request flood will not incur usage on a metered account. Safeguards contain storage/email use, not the underlying bandwidth cost of every rejected request.
## Canonical-domain protections (17 October 2026)

- Cloudflare **zone edge WAF rate-limit rule enabled** for POST `/api/inquiries` and POST `/mcp` on both apex and www: 12 requests per 10 seconds per IP and Cloudflare location, blocking for 10 seconds. Cloudflare free-plan entitlements determined these window values; this is not a global cap.
- The old `open-address.hi-1ff.workers.dev` hostname is disabled, removing the alternate route that would bypass zone-level edge rules.
- Worker contact limits (20 requests/minute per IP, 200/minute/location) and atomic D1 ceilings (8 accepted/IP/day, 64 globally/day) remain active; email alerts are capped at 3/day. Security controls do not prove a strict spending cap on a metered Workers account.
- Operator endpoints (`/operator` and `/operator/api/…`) require `ctx.access.getIdentity()` and an exact match to the private `OWNER_EMAIL` secret, with same-origin requirements for mutations. The account does **not** currently have Cloudflare Zero Trust Access activated: therefore, the inbox is intentionally inaccessible and returns 403. See [OPERATOR.md](OPERATOR.md) for the one-time setup step.
- MCP is public but deliberately narrow: research and contact descriptions plus one authorised human-enquiry submission tool. It applies the same anti-abuse and D1 acceptance checks. Agent-provided text is untrusted and never interpreted as instructions.
- External live-client verification and end-to-end email delivery on a real accepted enquiry remain outstanding; test safely before publicity.

## Spam-alert screening (19 October 2026)

The Worker now runs a **local deterministic and conservative** `src/screening.mjs` classifier after its existing admission/quota controls. It focuses on *combinations* of overt marketing language (e.g. sales pitches about SEO rankings, requesting contact details, mass-platform lists), not mere mentions of AI, SEO, marketing or commercial work. The visitor-declared `sender_kind` never overrides screening.

All accepted enquiries are still stored privately, with the same confidential receipt-token lifecycle. A separate `screening` verdict, score and generic rationale are stored in D1. Suspected spam suppresses owner notification **before the three-per-day notification slot is claimed**. Screening is a judgment aid, not proof of sender identity, a ban, or a deletion. The owner-only inbox can review, flag or clear a message; it remains fail-closed until Cloudflare Access is activated.

No new billable ML, captcha service, external reputation API or paid service was introduced. The prior Worker/D1 quotas, Cloudflare WAF, and verified-email allowlist remain active. A conservative filter can miss clever spam or occasionally flag genuine correspondence; periodically review the spam category and adjust tests. This is not a guaranteed billing ceiling.

## 19 October 2026 · Readable email notifications

- At the operator's request, legitimate-looking accepted enquiries are now included in the plain-text email body so they can be read without unlocking the private dashboard. The notification contains an untrusted sender label, self-declared sender type, subject, accepted text (up to 4,000 characters), optional reply contact and enquiry ID. The SMTP subject remains fixed. Receipt tokens, private authentication secrets, attachments and executable HTML are never included.
- Suspected spam is still saved without notification, and **only three** non-spam alert attempts are permitted per UTC day. Email address allowlists, Cloudflare WAF, D1 caps and no-paid-inference architecture are unchanged.
- Email is an additional copy held by a separate provider and cannot be recalled by deleting the D1 record. The public contact, privacy and trust pages now disclose that messages can be emailed to the private project operator and discourage secrets/confidential material.
