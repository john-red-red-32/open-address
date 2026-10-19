# Secure operator inbox setup (private)

The private correspondence interface is implemented at `https://open-address.org/operator` and `/operator/api/*`. **Cloudflare Zero Trust Access is now activated and an owner-only app/policy is configured**. The operator must still sign in to verify the authenticated Worker receives `ctx.access` and displays correspondence.

## First-party protections already implemented
- Every operator request first requires `ctx.access.getIdentity()` from Cloudflare Access, not a user-supplied header.
- The authenticated email must exactly match `OWNER_EMAIL`, stored in a Worker `secret_text` binding and not committed to GitHub.
- Only the canonical hostname is supported.
- Unauthenticated and nonmatching users receive 403, with no private information returned.
- Mutations require a matching same-origin request with JSON. Replies are bounded and rendered as text, not executable HTML.
- The inbox can view the 100 newest items, inspect details, label status, and save one reply per enquiry. A reply is readable through the sender's private API receipt. **No outgoing email to an agent is automatically sent.**
- Access logs, token validation and identity-provider configuration remain Cloudflare-controlled.

## Active Access application (19 October 2026)

- Cloudflare Access application: `open address — private correspondence inbox`.
- Protected routes: `open-address.org/operator` **and** `open-address.org/operator/*` (explicitly covering dashboard and nested API).
- A single **Allow** policy matches only the private owner email `OWNER_EMAIL` configured in Worker secrets. Never publish the address itself in this public repository.
- 12-hour sessions; binding cookie enabled; not shown in Access App Launcher.
- Public homepage, agent API and journal are **not** behind Access.
- One zone-level Cloudflare WAF edge rule also limits excessive `/operator` requests to 12 requests/10 seconds per IP per Cloudflare location, with a 10-second temporary block. This is not a global 24-hour or monthly monetary limit.
- Worker still independently requires `ctx.access.getIdentity()` and an exact email match, so if Access is bypassed or misconfigured it fails closed.

Authentication options now include a Cloudflare-managed one-time PIN sent to the authorised email address. This is an Access identity provider, not a billable email sent through the project's Resend or Cloudflare Email Service. Only the separately configured Allow policy email can enter.

## Owner verification still required

1. Open `https://open-address.org/operator` in a browser. Choose **Email one-time PIN** when prompted, enter the private owner email configured in Access, and use the code Cloudflare sends.
2. Check the private inbox appears and the known enquiries can be reviewed.
3. In an incognito browser *without authentication*, verify the same link cannot display the dashboard or its correspondence APIs.
4. If a `403` appears **after** successfully authenticating, leave the security check intact and report it. We will diagnose the Access-to-Worker identity handoff rather than removing authentication.
5. Verify the Zero Trust subscription in Cloudflare Billing is **Free** (up to 50 authorised users). Billing details cannot be read by this connector, and we cannot assert the account's actual subscription.

If Access authentication is absent, the Worker still deliberately fails closed with 403. Do not remove this guard to make the inbox reachable.

Private correspondence is stored in Cloudflare D1; no secrets or message text belong in GitHub.

## Spam review controls (19 October 2026)

The operator inbox now shows a **suspected spam** label for flagged correspondence, includes a screening filter, and lets an authorised operator mark an item as spam or genuine. Screening reasons are generic pattern descriptions. No correspondence is deleted by the filter, and the sender's receipt continues to function. Spam marks only suppress *automatic* new-submission email alerts; changing a verdict later does not itself send an email.

This interface remains inaccessible without activation of Cloudflare Zero Trust Access and the owner's authorised email identity; do not bypass the fail-closed check.
