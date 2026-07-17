# QuMarket Self-Service Deployment Protocol

Status: production-ready design contract; backend enforcement required in QuIdentify, QuPay, QuHub, QuFense, QuVault and QuAudit.

## Mandatory commercial sequence

1. Customer selects products and endpoint tier in QuMarket.
2. Customer must authenticate through QuIdentify / Okta before quoting, downloading product material or purchasing.
3. QnQ Platform sends the basket to QuCFA for commercial price evidence.
4. QuFense evaluates the transaction policy.
5. QuPay opens Stripe checkout only after identity and policy are approved.
6. QuHub sends fulfillment email after payment confirmation.
7. QuVault exposes ephemeral activation material only after QuIdentify re-authentication.
8. QuAgent guides installation and verification.
9. QuAudit records identity, quote, payment, fulfillment, key ceremony, activation and deployment evidence.

## Fulfillment email package

The post-payment email should include attachments or secure links for:

- Receipt and order summary.
- Technical sheets for purchased products.
- Certification and compliance pack.
- Installation guide.
- Deployment manifest.
- QuAgent onboarding URL.
- Time-bound activation link.

The email must not contain raw secrets, permanent API keys, cards, tokens or unencrypted credentials.

## Ephemeral key policy

- QuFense generates or brokers activation material per macro-process, order and service.
- Activation material is stored in QuVault.
- The customer receives only a time-bound activation link.
- The customer must re-authenticate with QuIdentify / Okta before retrieving activation material.
- Default retrieval TTL: 15 minutes.
- Keys rotate per activation, renewal, major policy update or suspected exposure.
- All retrievals are logged in QuAudit.

## Customer self-service deployment

1. Upload or paste endpoint inventory.
2. QuAgent validates IP format, duplicates and package limits.
3. QuIdentify validates the deployment owner.
4. QuFense applies the purchased policy profile.
5. QuVault retrieves ephemeral activation material after re-authentication.
6. QuHub provisions connectors and product configuration.
7. Customer installs endpoint agent/sensor or connector package.
8. QuAgent runs health checks.
9. QuSOC receives telemetry when included.
10. QuAudit stores deployment evidence.

## Production backend requirements

- QuIdentify must sign the callback; frontend-only query parameters are not sufficient as proof of identity.
- QuPay must create server-side Stripe sessions; no payment secrets in browser code.
- QuHub must send transactional emails and secure links.
- QuVault must use a real secrets backend for production secrets.
- QuFense must issue policy decisions and key ceremony evidence.
- QuAudit must store immutable evidence.
