# open address — correspondence and billing audit

Updated 16 October 2026. This document describes safeguards **implemented in code**, with separate notes about account controls we cannot verify through the current integration.

## Existing public API

`POST /api/inquiries` accepts text-only JSON (sender, declared type, subject, message, optional reply contact). Accepted messages are stored privately in the EU-jurisdiction Cloudflare D1 database. The requester receives a one-time receipt token; only a salted hash of that token is stored. `GET` and `DELETE /api/inquiries/{id}` require the matching Bearer token. The service has no arbitrary task execution, paid model calls, outbound requests to user-provided URLs, or wallet integration.

## Safeguards

- Application-level per-location Cloudflare Rate Limiting API bindings, both **mandatory**: `CONTACT_IP` 20 API requests/minute per source IP and `CONTACT_GLOBAL` 200 API requests/minute per Cloudflare location. These counters are approximately consistent and location-local; they are **not global hard caps**.
- D1 accepted-enquiry ceilings, enforced atomically across all traffic: 8 accepted submissions per salted source IP per UTC day, 64 accepted submissions project-wide per UTC day, regardless of IP rotation. After reaching the cap, the API returns 429. A denial may still cost a Worker invocation or a small D1 query.
- Maximum 8,192 bytes per JSON submission, read as a bounded stream; maximum 4,000 characters for the message. Content-Type validation and restricted fields.
- Email notifications are enabled with three server-side settings (`EMAIL` send binding, verified `NOTIFICATION_TO` and `NOTIFICATION_FROM`). At most **3** notification attempts per UTC day. Recipient and sender cannot be chosen by the request. Email contains only a fixed notification subject and accepted enquiry ID, not user-supplied message text, receipt token or private email address.
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