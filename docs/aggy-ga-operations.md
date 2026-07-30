# Aggy Core 1.2.2 GA operations

## Supported scope

Aggy Core GA covers Voice LIVE through the backend-mediated OpenAI Realtime
connection, assistant chat, the ten-minute visitor trial, signed contract
entitlements, prepaid Time AI QVit and QuPay LIVE.

External colleague messaging, CDR-protected attachments and E2EE/PQC calls are
preview capabilities. They remain fail closed until QuIdentify organization
binding, a contracted CDR provider, QuVault receipts, signaling, protected media
and managed-tunnel evidence are present. No NIAP certification is claimed.

## Ownership and support

- Product and promotion authority: Eddie Velasquez Ortiz.
- Operational orchestration: SQAILE Core and QuCOO.
- Customer support route: QuSupport through the Marketplace.
- Security governance: QuCISO and QuFense.
- Release evidence and post-incident review: QuAudit.
- Payments and metering: QuPay, QuCFA, QVit and QuOptio.

## Service objectives

- Monthly availability objective for the supported Aggy Core endpoints: 99.9%.
- Health endpoints are checked before release and after deployment.
- Severity 1 acknowledgement objective: 30 minutes.
- Severity 2 acknowledgement objective: 4 business hours.
- No paid provider session starts without an atomic lease.
- Failed startup releases the lease; no silent renewal or overdraft is allowed.

These are SECQUOIA operating objectives, not third-party-provider guarantees.
OpenAI, Stripe and Cloudflare remain governed external dependencies.

## Security and privacy

- Standard OpenAI credentials remain server-side.
- Browser origins are allowlisted and request bodies are bounded.
- Visitor identity is pseudonymous and isolated per browser.
- QuGEO does not return or persist the public IP.
- QVit credit requires a signed, timestamp-bounded and idempotent QuPay event.
- Stripe card data is handled by Stripe; SECQUOIA does not store card data.
- QuFense authorizes Checkout inside SECQUOIA. The final Stripe handoff uses
  Stripe-managed HTTPS; no claim of Stripe-native PQC is made.
- Logs contain bounded identifiers and status metadata, not API keys, card data
  or raw voice.

## Incident response and rollback

1. QuSOC/QuSupport records the incident and affected release.
2. QuFense may block new paid sessions while existing leases settle.
3. QuPay webhook processing remains idempotent; credits are never recreated by
   replaying a Checkout.
4. QuDeploy rolls the affected Worker back to the last known-good Cloudflare
   version with `wrangler rollback <VERSION_ID>`.
5. Static assets are reverted through the versioned Git release.
6. QuAudit records the version IDs, timestamps, smoke results and corrective
   action.

## Compatibility and support window

- Public integration contract: `aggy-release.json` and the version endpoint.
- Stable 1.x integrations receive backward-compatible fixes.
- A breaking public integration change requires Aggy 2.0.0.
- The previous stable minor line receives security fixes for at least 90 days
  after a successor becomes GA.
- Preview capabilities may change without stable-API guarantees and must not be
  used as evidence of production readiness.
