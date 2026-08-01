# Aggy 1.3.0-rc.1 flow reengineering

## Outcome

The candidate unifies visitor, contracted and paid Voice LIVE continuity under
one server-authoritative state machine. Aggy remains visible and attempts to
prepare Voice LIVE automatically, but it does not bypass browser microphone
permission or open a paid provider session without an atomic usage lease.

## Governed flow

1. QuOptio evaluates the active contract, free allowance, QVit balance, safety
   ceilings, rate-card age and explicit continuation consent.
2. QuIdentify authenticates with MFA and issues a five-minute receipt bound to
   the package, pseudonymous wallet reference and SECQUOIA return origin.
3. QuPay rejects legacy query markers, validates the receipt and asks QuFense
   to authorize the exact digest before creating Stripe Checkout.
4. Stripe completes payment over Stripe-managed HTTPS. SECQUOIA does not claim
   that Stripe terminates native PQC.
5. The return carries a short-lived QuPay confirmation capability. QuPay checks
   Stripe, credits Aggy immediately and idempotently, then returns a signed
   wallet binding. The Stripe webhook retries the same event identifier.
6. Aggy detects the server-confirmed balance, acknowledges the exact amount and
   available minutes, and resumes Voice LIVE when browser permission permits.

## Secrets and bindings

- `QUIDENTIFY_CHECKOUT_RECEIPT_SECRET`: at least 32 random bytes, shared only by
  QuIdentify and QuPay through their secret stores.
- `AGGY_QUPAY_WEBHOOK_SECRET`: existing QuPay-to-Aggy credit signing key.
- Existing Stripe restricted key and webhook signing secret remain server-side.
- No receipt, capability, provider key or raw identity is embedded in site code.

## Security boundaries

- Legacy `quidentify=verified` is never accepted as proof.
- The identity receipt expires within five minutes and contains only a subject
  fingerprint, not the raw Okta subject.
- Every paid minute is reserved before provider access; overdraft and silent
  continuation are disabled.
- Contract entitlements bypass the visitor timer only until signed expiry.
- Realtime SDP continues through the trusted backend to `/v1/realtime/calls`.

## Promotion order

1. Provision and verify the receipt secret in QuIdentify and QuPay.
2. Deploy QuIdentify and verify signed receipt issuance through protected Okta.
3. Deploy QuPay and execute negative bypass/tampering tests.
4. Deploy the Aggy usage Worker and static candidate assets.
5. Update approved surfaces, including QuSOC COMMAND 360.
6. Run one supervised USD 1 live purchase and confirm immediate credit, spoken
   acknowledgment and resumed Voice LIVE on desktop and mobile.
7. Record QuAudit evidence and obtain Eddie Velásquez Ortiz approval before
   production promotion or third-party sale.

## Rollback

Roll back in reverse order: restore approved embeds, static assets, Aggy Worker,
QuPay and QuIdentify. Keep the new receipt secret present until all in-flight
five-minute receipts and two-hour confirmation capabilities have expired. Do
not restore trust in legacy query markers.
