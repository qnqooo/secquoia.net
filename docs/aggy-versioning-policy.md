# Aggy versioning and promotion policy

Aggy uses Semantic Versioning in the form `MAJOR.MINOR.PATCH`, with prerelease identifiers such as `alpha`, `beta` and `rc`.

## Version increments

- `PATCH`: backward-compatible correction with no new public capability.
- `MINOR`: backward-compatible capability, model integration or material behavior improvement.
- `MAJOR`: incompatible public API, integration or contractual behavior change.
- Any change to released contents requires a new version; an existing release is never silently rewritten.

## Release channels

- `development`: local or internal work; not customer-facing.
- `alpha`: incomplete preview with known gaps.
- `public-beta`: externally reachable evaluation release; no stability or resale claim.
- `rc`: release candidate with frozen public API and completed launch evidence.
- `stable`: production release covered by approved operational and commercial controls.

## Production and third-party sale gates

The version number alone never authorizes production or resale. `productionApproved` and `thirdPartySale` remain `false` until an explicitly approved release records all applicable evidence:

1. Stable, documented public API and integration contract.
2. Security, privacy, data-processing and model-provider review.
3. Billing, QVit metering, taxes, provider-cost disclosure and customer limits.
4. Tenant isolation, credentials, rate limits, abuse controls and audit trail.
5. Support ownership, SLA/SLO, incident response, rollback and version support window.
6. Third-party package, onboarding, licensing, terms, documentation and compatibility tests.
7. Successful release validation and explicit promotion approval.

The first commercial third-party release should be `1.0.0` or later and must publish its release manifest and changelog before activation.
