# Aggy changelog

All notable Aggy releases are recorded here. Versions follow [Semantic Versioning 2.0.0](https://semver.org/).

## 1.0.0-rc.19 - 2026-07-27

### Fixed

- Restored automatic Aggy panel deployment when a public SECQUOIA ecosystem page loads.
- Preserved the launcher, close button and Escape-key controls after the automatic opening.
- Prevented automatic opening from stealing keyboard focus from the page.
- Updated public loader cache keys for SECQUOIA.NET, SECQUOIA.GROUP and QnQ.

## 1.0.0-rc.18 - 2026-07-27

### Changed

- Established one shared 300-second Aggy Voice LIVE allowance per pseudonymous user across the SECQUOIA website ecosystem.
- The free clock starts only when a LIVE voice conversation starts; browsing a website does not consume the allowance.
- Hid payment and QVit actions while free time remains.
- After the free allowance ends, Aggy presents either a QVit top-up action or an explicit one-minute continuation confirmation.

### Security and cost controls

- Paid continuation now fails closed unless the client sends explicit confirmation for that single one-minute reservation.
- Existing QVit balance is never silently reserved after the free allowance ends.
- QuPay top-up remains user-initiated and no automatic overdraft or charge is permitted.

## 1.0.0-rc.17 - 2026-07-27

### Changed

- Published explicit QuPay readiness in the Voice health and usage APIs.
- Kept the complete 300-second free allowance continuous while billing paid continuation in 60-second `Aggy Minute` units.
- Replaced the misleading automatic top-up action with an assisted activation route while the signed QuPay LIVE webhook is not configured.
- Changed an unconfigured QuPay credit receiver to fail closed with `503 qupay_credit_not_configured`.

## 1.0.0-rc.16 - 2026-07-26

### Added

- Added a server-side Aggy usage meter backed by a per-subject SQLite Durable Object.
- Included one lifetime five-minute trial, followed by prepaid 60-second `Aggy Minute` microleases.
- Connected QuCFA quoting, QVit reservation, signed QuPay credit events, QuFense hard limits and QuAudit ledger receipts.
- Added visible free-time, QVit balance, block price and top-up status to the Voice interface.

### Security and cost controls

- Realtime SDP creation now fails closed unless an atomic usage lease was reserved first.
- QVit overdrafts are prohibited; each paid minute is reserved before the OpenAI call.
- Default limits are fifteen paid minutes per day and one hundred fifty per month for each pseudonymous edge subject.
- Added QuOptio policy `2026-07-26.1`: no silent model downgrade, semantic VAD, context-retention control, and a preventive stop at 90% of the provider-cost reserve.
- Every `response.done` usage record is normalized against the versioned `gpt-realtime-2.1` public rate card and deduplicated by response ID.
- Lost heartbeats, elapsed leases and exhausted provider-cost reserves close the client session.
- QuPay credits require a five-minute replay window, HMAC verification and an idempotent event ID.

## 1.0.0-rc.15 - 2026-07-26

### Changed

- Replaced every remaining legacy call state, instruction and evidence label with the canonical `E2EE/PQC` profile name.
- Added a regression check that rejects noncanonical cryptography wording across public SECQUOIA and Aggy assets.
- Preserved compatibility-bound API field names while keeping their displayed values and descriptions canonical.

## 1.0.0-rc.14 - 2026-07-26

### Changed

- Rebuilt the compact and mobile chat layout at widths up to 780 px to eliminate the split-view overflow reported in production.
- Removed profile fields and secondary quick actions from the mobile conversation surface.
- Added a WhatsApp/Cellcrypt-style composer with direct attachment, camera, voice and send controls.
- Added an attachment tray for documents, photos, videos and direct camera capture.

### Security

- Every selected document, gallery item or camera photo enters local QuSOC preflight and quarantine.
- No attachment is transmitted while Glasswall, QuSOC, QuFense, E2EE/PQC and QuVault admission evidence is incomplete.
- Existing call preflight still blocks microphone and camera access until the encrypted-media route is verified.

## 1.0.0-rc.13 - 2026-07-26

### Changed

- Made the Cellcrypt-inspired conversation center the primary Aggy experience.
- Moved Contacts, Groups, Calls, Files, Voice, AI Models, Security and Settings into one compact application grid.
- Added audio, video, attachment and menu actions directly to conversation headers, plus an attachment action in each composer.
- Added direct return-to-chat navigation from every secondary area and simplified the mobile layout.

### Security

- Secure text continues through QuSOC sanitation before E2EE/PQC encryption and ciphertext-only room delivery.
- Attachment selection now starts from the chat, but transfer remains fail closed until Glasswall, QuSOC, QuFense and QuVault return valid admission evidence.
- Audio and video actions now start from the chat, but microphone and camera access remains blocked until the backend proves identity, signaling, key exchange and encrypted media readiness.

## 1.0.0-rc.12 - 2026-07-26

### Changed

- Standardized the ecosystem cryptography name as E2EE/PQC across Aggy, Marketplace, public product literature and deployment metadata.
- Added the canonical E2EE/PQC profile to public device bundles, encrypted message headers, release metadata and worker health responses.
- Retained exact normative algorithm identifiers and fail-closed validation; historical evidence remains unchanged.

### Security

- New device bundles and message envelopes are rejected when their declared cryptographic profile is not exactly `E2EE/PQC`.
- The E2EE/PQC label identifies the architecture profile and does not claim external certification.

## 1.0.0-rc.11 - 2026-07-26

### Changed

- The universal Aggy launcher now opens the complete communications interface instead of the legacy voice-only widget.
- Added an isolated embed mode for external SECQUOIA sites, preserving Chats, secure rooms, Contacts, Calls, Groups, Voice, AI Models and Security.
- The launcher remains compact until the user opens it; the embedded experience is responsive on desktop and mobile.

## 1.0.0-rc.10 - 2026-07-26

### Added

- Added a Cellcrypt-inspired chat layout with a conversation list, explicit secure room and responsive mobile navigation.
- Added client-side hybrid ML-KEM-768 + X25519 key encapsulation, ML-DSA-65 signatures, HKDF-SHA-512, AES-256-GCM and XChaCha20-Poly1305 message envelopes.
- Added per-room Durable Objects SQLite storage for public device bundles and ciphertext-only message envelopes.
- Added a transient QuSOC text sanitation and reconstruction policy before encryption.
- Added manual out-of-band device fingerprint comparison while QuIdentify/Okta organization binding remains pending.
- Added a Glasswall adapter status contract. Attachments remain fail closed and no Glasswall API call or external cost is executed in this release.

### Security

- Private device keys remain in browser IndexedDB; room invitations carry a random capability in the URL fragment so it is not sent in ordinary HTTP requests.
- Incoming messages fail closed when the signature, recipient, admission receipt or ciphertext authentication cannot be verified.
- This release candidate does not claim external PQC certification, production approval, organizational identity assurance or scanned attachments.

## 1.0.0-rc.9 - 2026-07-25

### Changed

- Reorganized the Marketplace assistant around Chats, Contacts, Calls, Groups and More while preserving Voice, Files, AI Models and Security.
- Added responsive contact and group directories, search, direct call preparation and session-only activity history.
- Added individual/group audio/video call controls with an evidence-based E2EE/PQC preflight.
- Calls fail closed: no microphone or camera capture occurs unless QuIdentify, signaling, key exchange, media E2EE/PQC, QuFense and QuVault return complete backend evidence.
- Added a governed preflight endpoint contract that reports the current call infrastructure as unavailable until the required services are configured.

## 1.0.0-rc.8 - 2026-07-25

### Changed

- Aggy Voice is now presented as “Voz de SQAILE - Acento neutro”.
- Spanish speech guidance now uses a clear, warm, internationally neutral accent instead of a regional accent.

## 1.0.0-rc.7 - 2026-07-25

### Fixed

- The compact Aggy widget can now open the full Marketplace experience after a user taps the link.
- The iframe retains its isolation and grants only user-activated top-level navigation.

## 1.0.0-rc.6 - 2026-07-25

### Changed

- Aggy now attempts to open the microphone and start the Realtime session automatically after QuGEO and service preflight complete.
- The first spoken turn is compact and immediate: one friendly identification and one direct help question.
- The application no longer inserts its own microphone-consent step; browsers may still require their native first-use permission.

## 1.0.0-rc.5 - 2026-07-25

### Fixed

- Restored the current documented `gpt-realtime-2.1` model and text multipart fields required by the unified WebRTC interface.
- Added a valid end-to-end SDP negotiation probe before declaring the mobile voice path healthy.

## 1.0.0-rc.4 - 2026-07-25

Realtime provider contract correction.

### Fixed

- Internal transport experiment; superseded by `1.0.0-rc.5` before production validation completed.
- Versioned all ecosystem loaders again so mobile browsers receive the corrected provider contract immediately.

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
