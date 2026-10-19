# Secure operator inbox setup (private)

The private correspondence interface is implemented at `https://open-address.org/operator` and `/operator/api/*`, but **will not display correspondence until the operator has enabled Cloudflare Zero Trust Access**.

## First-party protections already implemented
- Every operator request first requires `ctx.access.getIdentity()` from Cloudflare Access, not a user-supplied header.
- The authenticated email must exactly match `OWNER_EMAIL`, stored in a Worker `secret_text` binding and not committed to GitHub.
- Only the canonical hostname is supported.
- Unauthenticated and nonmatching users receive 403, with no private information returned.
- Mutations require a matching same-origin request with JSON. Replies are bounded and rendered as text, not executable HTML.
- The inbox can view the 100 newest items, inspect details, label status, and save one reply per enquiry. A reply is readable through the sender's private API receipt. **No outgoing email to an agent is automatically sent.**
- Access logs, token validation and identity-provider configuration remain Cloudflare-controlled.

## Action required from the account owner
1. In the Cloudflare dashboard, open **Zero Trust / Access** and complete the initial **Enable Access** setup. This may require user agreement acceptance; do not automate agreement acceptance without the owner.
2. Create a **self-hosted Access application** protecting the canonical domain path `open-address.org/operator*` (ensure both `/operator` and `/operator/api/*` are included), not the entire public website.
3. Use a tightly scoped **Allow** policy with **only the owner's existing verified email address**, ideally with MFA. Do not select Everyone, all email domains, Bypass or the public `baby@open-address.org` alias as the identity.
4. Verify unauthorized access is blocked before Worker execution. Sign in and test viewing an enquiry and saving a reply.
5. Keep the legacy workers.dev hostname redirected, and never expose operator API via an alternate domain. Do not grant public or generic agent access to the inbox.

If Access is not enabled, the current Worker deliberately fails closed with 403. Do not remove this guard to make the inbox reachable.

Private correspondence is stored in Cloudflare D1; no secrets or message text belong in GitHub.

## Spam review controls (19 October 2026)

The operator inbox now shows a **suspected spam** label for flagged correspondence, includes a screening filter, and lets an authorised operator mark an item as spam or genuine. Screening reasons are generic pattern descriptions. No correspondence is deleted by the filter, and the sender's receipt continues to function. Spam marks only suppress *automatic* new-submission email alerts; changing a verdict later does not itself send an email.

This interface remains inaccessible without activation of Cloudflare Zero Trust Access and the owner's authorised email identity; do not bypass the fail-closed check.
