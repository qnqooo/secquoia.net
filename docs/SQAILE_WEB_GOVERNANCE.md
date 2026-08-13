# SQAILE web governance

SECQUOIA Cybersecurity preserves its own brand and public runtime while adopting the shared SQAILE control model.

## Boundaries

- Every operational call follows `Interface -> platform BFF -> QuHub -> private engine API -> connector/provider`.
- The platform BFF validates QuIdentify session, role, tenant, request shape and anti-replay context before QuHub receives the operation.
- Cloudflare is the DNS, TLS, WAF, rate-limit and edge-policy layer.
- QuIdentify governs private or privileged journeys; the public website does not imply application authorization.
- QuHub is the only approved gateway to external providers. Browser code receives neither provider credentials nor QuVault values.
- QuFense and QuSOC enforce and observe security. QuAudit records release evidence.
- QuCOO authorizes operational intent; QuDeploy promotes a pinned immutable revision; QuSupport owns incident continuity.
- A missing control, identity assertion or secret reference fails closed. No demo or snapshot is labelled LIVE.

## Promotion gate

The source score can reach 100/100 when all repository controls pass. Production reaches 100/100 only after the domain serves the pinned revision through Cloudflare, headers are observed externally, negative access tests pass where applicable, monitoring is healthy and rollback is proven.
