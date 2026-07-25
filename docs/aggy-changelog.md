# Aggy changelog

All notable Aggy releases are recorded here. Versions follow [Semantic Versioning 2.0.0](https://semver.org/).

## 1.0.0-rc.3 - 2026-07-25

Immediate mobile cache refresh.

### Fixed

- Versioned the Marketplace voice client, compact widget, iframe and ecosystem loader URLs.
- Mobile browsers now request the Safari-compatible Voice client without requiring users to clear their browser cache.

## 1.0.0-rc.2 - 2026-07-25

Mobile voice compatibility correction.

### Fixed

- Replaced `AbortSignal.timeout()` with an `AbortController` timer compatible with Safari/iOS and older mobile browsers.
- Applied the compatible timeout path to health, QuGEO, knowledge and Realtime session requests.
- Preserved bounded retry behavior for cold starts without falsely reporting an active backend as disconnected.

## 1.0.0-rc.1 - 2026-07-25

Production-validation release candidate.

### Added

- Universal, isolated Aggy launcher for the SECQUOIA/QnQ website ecosystem.
- Compact Realtime Voice surface shared by public sites and private microsites.
- Explicit rollout inventory for SECQUOIA, QnQ, QuChat and QuSpace.

### Changed

- Marketplace hero content now starts at the top of its card and its primary message is 10% larger.
- Voice health prewarm retries bounded cold starts before reporting an outage.
- Distribution advances from first-party beta to ecosystem-hosted release candidate.

### Validation

- 44 automated tests pass.
- QuChat and QuSpace production builds complete with the pinned dependency set.
- Public routes, Aggy Voice health, CORS and mult/site loader delivery are externally verified.

### Commercial status

This release candidate is deployed for production validation. Stable GA and third-party sale remain disabled until the operational, security, billing, SLA, licensing and compatibility gates in the versioning policy are approved with evidence.

## 0.1.0-beta.1 - 2026-07-25

First formally versioned public beta.

### Added

- Live bidirectional voice over OpenAI Realtime and secure WebRTC.
- Governed `marin` voice with a consistently feminine presentation.
- Natural Colombian Spanish default (`es-CO`) with QuGEO language context.
- QuHub grounding in the three authorized SECQUOIA websites.
- SQAILE Core orchestration and manual provider selection in IA Models.
- QuCFA/QVit provider-cost projection with fail-closed unverified pricing.
- Public release manifest and API-visible release metadata.

### Changed

- Voice output runs at `1.08x` with high-eagerness semantic VAD for faster turns.
- Source URLs are optional and never delay or block a response.
- Legacy browser speech and recording paths remain disabled.

### Commercial status

This release is a first-party hosted public beta for evaluation. It is not approved as a stable production module or for third-party sale.
