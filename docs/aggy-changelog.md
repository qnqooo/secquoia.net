# Aggy changelog

All notable Aggy releases are recorded here. Versions follow [Semantic Versioning 2.0.0](https://semver.org/).

## 1.2.2 - 2026-07-30

### Stripe idempotency hardening

- Sends one QuPay Checkout request per user action and leaves any subsequent
  retry under explicit user control.
- Avoids replaying a newly issued QuFense authorization receipt under the same
  Stripe idempotency key, which Stripe correctly rejects when request metadata
  differs.
- Retains the compact, deduplicated payment status introduced in 1.2.1.

## 1.2.1 - 2026-07-30

### QuPay checkout continuity

- Keeps Aggy compact while QuPay prepares Checkout; payment status no longer
  expands the conversation panel automatically.
- Reuses one keyed status message so retries replace the prior state instead of
  filling the chat with duplicated opening and failure notices.
- Originally added one transient retry with the original idempotency key; this
  behavior was superseded by 1.2.2 after production validation showed that a
  renewed QuFense receipt changes the Stripe request metadata.
- Preserves fail-closed validation, hides Aggy before top-level navigation and
  keeps card data entirely within Stripe Checkout.

## 1.2.0 - 2026-07-30

### Commercial and technical consultant

- Adds a governed consultant playbook covering SECQUOIA Strategic Holdings,
  the eight cybersecurity lifecycle groups and the transversal platform
  engines.
- Gives Aggy a discovery method that connects customer needs to business
  impact, recommends a minimum viable path and closes with one practical next
  action.
- Adds professional narratives for cybersecurity by design, SQAILE ethical and
  epistemological governance, modular activation and governed provider
  orchestration.
- Distinguishes repository-tested PQC, QRNG-contributed hybrid key derivation,
  classical Hamiltonian policy optimization and quantum-inspired simulation
  from formal certification or physical quantum computing.
- Publishes the same structured context through QuHub for Voice LIVE and
  multi-provider chat while preserving website grounding and fail-closed
  provider boundaries.

## 1.1.0 - 2026-07-30

### Experiential Time AI payment journey

- Replaces the passive payment return with a compact, non-blocking confirmation
  moment that shows the exact payment and Voice LIVE minutes.
- Adds an animated three-stage route from payment confirmation to activated
  Time AI and an Aggy-ready state.
- Keeps the full communications panel collapsed until the customer chooses the
  single primary action, `Continuar con Aggy`.
- Updates the compact launcher with the purchased minutes and preserves a
  secondary `Ahora no` path without interrupting the website.
- Uses responsive, reduced-motion-aware presentation across the native
  Marketplace and ecosystem embeds.

## 1.0.4 - 2026-07-30

### Contextual post-payment voice greeting

- States the exact server-confirmed payment amount and purchased Voice LIVE
  minutes in Aggy's first post-payment spoken response.
- Thanks the customer naturally and offers either to resume the previous topic
  or start a new support request.
- Preserves the one-time greeting through a transient WebRTC retry while
  excluding Stripe, QuPay, QVit, wallet and webhook mechanics from speech.
- Advances all public client assets to `1.0.4` so the improved prompt is loaded
  without a forced browser cache clear.

## 1.0.3 - 2026-07-30

### Paid Time AI continuity and deterministic client refresh

- Makes the compact launcher recognize an available paid QVit balance after the
  complimentary Voice LIVE period ends.
- Opens Aggy to continue the paid conversation instead of reopening the package
  selector.
- Preserves the one-time payment thank-you greeting across a transient WebRTC
  retry without storing card data or Stripe secrets.
- Advances every public client asset URL to `1.0.3` so browsers receive the
  corrected continuity flow without requiring a forced cache clear.

## 1.0.2 - 2026-07-30

### Verified payment return and Voice LIVE resume

- Adds a server-verified Stripe Checkout confirmation route. A browser return
  parameter alone can no longer claim a paid continuation.
- Rebinds the paid QVit wallet through a time-bound HMAC capability verified by
  Aggy, including across the Stripe top-level return.
- Waits briefly for the signed webhook credit, then resumes Voice LIVE and asks
  Aggy to thank the customer and invite them to continue the conversation.
- Adds the USD 5 Time AI package with 5,000,000 QVit and a commercial allowance
  of 20 additional Voice LIVE minutes.
- Keeps payment, credit and voice consumption fail closed: no browser-side
  amount, package or success flag can create QVit.

## 1.0.1 - 2026-07-29

### Clear continuity after the visitor trial

- Changes the compact launcher to a persistent yellow exhausted state when the
  ten complimentary Voice LIVE minutes reach zero.
- Replaces the obsolete “10 min gratis” prompt with two explicit routes:
  continue through secure assistant chat, or choose a prepaid Time AI package.
- Adds a compact, mobile-first selector for the governed USD 1, 10, 25, 100
  and 500 packs before handing the customer to the Marketplace.
- Keeps checkout user-initiated: selecting a pack prepares the Marketplace
  review; it does not charge, renew or start a paid voice minute automatically.
- Carries the opaque QVit wallet reference from the server-governed usage state
  and preserves top-level navigation so Aggy cannot cover Stripe Checkout.

## 1.0.0 - 2026-07-29

### General Availability

- Promotes Aggy Core to stable GA with explicit approval by Eddie Velasquez Ortiz.
- GA scope: Voice LIVE, assistant chat, the ten-minute visitor trial, signed
  contract entitlements, prepaid Time AI QVit and QuPay LIVE.
- Keeps `gpt-realtime-2.1` and the published OpenAI rate card under QuOptio's
  fail-closed freshness policy.
- Records production evidence, operational ownership, rollback, security,
  billing and compatibility controls in `aggy-ga-evidence.json` and
  `docs/aggy-ga-operations.md`.
- External secure messaging, CDR-protected attachments and E2EE/PQC calls stay
  preview-only and fail closed. This GA release makes no claim that Glasswall,
  managed call media or NIAP certification is active.

## 1.0.0-rc.41 - 2026-07-29

### USD 10 Time AI package

- Adds a governed USD 10 prepaid package between the starter and USD 25 options.
- Credits 10,000,000 QVit only after a confirmed QuPay webhook.
- Estimates approximately forty additional Voice LIVE minutes using the
  current rate card, without automatic renewal or silent overdraft.

## 1.0.0-rc.40 - 2026-07-29

### Native Time AI Marketplace handoff

- Replaces the iframe-dependent purchase action with one native top-level link.
- Shows exactly one continuation control at a time: prepaid QVit continuation
  or package purchase.
- Opens the Marketplace already filtered to the available Time AI packages
  when the complimentary Voice LIVE allowance ends.

## 1.0.0-rc.39 - 2026-07-28

### One-step Time AI purchase entry

- Replaces the competing QVit and top-up controls with one contextual action.
- Sends visitors whose free Voice LIVE time ended directly to the Marketplace
  filtered to the available Time AI packages.
- Keeps one-click paid continuation only when a confirmed QVit balance already
  covers the next governed minute.
- Fixes the former `#ai-services` destination so it resolves to the actual
  Marketplace section.

## 1.0.0-rc.38 - 2026-07-28

### One contextual file entry point

- Places Voice LIVE, protected files and encrypted calls together in the active
  conversation header.
- Removes the redundant document, gallery and camera selection sheet.
- Uses one governed file input for photos, audio, video, ZIP, documents and
  other formats before CDR, QuFense and QuVault processing.
- Keeps the text composer limited to message and send.

## 1.0.0-rc.37 - 2026-07-28

### Simpler chat navigation

- Places Voice LIVE, protected files and encrypted calls in a single top action
  bar.
- Removes duplicate file, camera, voice and call controls from both chat
  composers.
- Keeps photo, video, document and camera intake inside the protected files
  workspace, with the existing CDR, QuFense and QuVault fail-closed gates.
- Moves collaboration setup, AI models, security and preferences to the app
  grid.

## 1.0.0-rc.36 - 2026-07-28

### Independent ten-minute trial per browser

- Separates the visitor trial by a persistent anonymous browser identity instead
  of sharing the allowance across devices behind one public IP.
- Sends the anonymous visitor identifier only to the Aggy usage and Realtime
  backend; it contains no personal data.
- Preserves QuIdentify contract entitlements, explicit QVit consent and
  fail-closed QuPay/QuFense controls.

## 1.0.0-rc.35 - 2026-07-27

### Single launcher and clearer conversation surface

- Removes the Marketplace launcher from embedded Aggy so every website exposes exactly one public entry point.
- Forces the embedded conversation to remain expanded inside its frame while the public panel stays closed until the visitor taps Aggy.
- Widens the desktop panel and keeps the active conversation at full width.
- Moves colleague invitation into the grid menu to keep the message composer immediately usable.
- Preserves the top-level QuPay handoff so Stripe Checkout cannot be covered by Aggy.

## 1.0.0-rc.34 - 2026-07-27

### Full-width chat and resilient embedded loading

- Gives the active conversation the complete panel width on desktop and mobile.
- Moves conversation switching for Aggy and secure rooms into the grid menu.
- Collapses secure-room setup until the user needs to create or join a room.
- Adds an explicit loading state, bounded automatic retries and a manual retry action when the embedded experience does not become ready.
- Refreshes all public asset versions so browsers do not retain the previous narrow layout.

## 1.0.0-rc.33 - 2026-07-27

### Compact-by-default communications and unobstructed QuPay

- Keeps the Aggy chat panel closed on page load while Voice LIVE initializes in the background.
- Opens the communication-first chat only after the user taps the Aggy launcher.
- Adds a blue visual guide pointing to chat, secure files and encrypted individual or group calls.
- Navigates the top-level page to governed Stripe Checkout so an embedded Aggy panel cannot cover or trap QuPay.
- Adds a concise spoken reminder that advanced communication functions are available from the Aggy button.

## 1.0.0-rc.32 - 2026-07-27

### Time AI Checkout recovery and stronger action contrast

- Forces black typography on green primary actions for stronger contrast.
- Adds a governed USD 1 Time AI starter pack and routes Aggy's exhausted trial directly to it.
- Makes QuPay Checkout visibly pending, retryable and explicit when the QuPay-QuFense channel fails closed.
- Keeps Stripe card data outside SECQUOIA and preserves QuFense authorization before Checkout creation.

## 1.0.0-rc.31 - 2026-07-27

### Digital Voice LIVE timer and governed preview access

- Adds a ten-link compact digital meter synchronized with the server-side Voice LIVE allowance.
- Illuminates one link per consumed minute through a green-to-red progression and leaves the completed bar red when the allowance ends.
- Hides the visitor meter for contracted access and for SuperAdmin-approved `ECOSYSTEM_PREVIEW` passes.
- Adds signed, expiring, QuIdentify-bound preview grants for internal testing and special projects without relying on IP-only allowlists.
- Restricts preview issuance to SuperAdmin, limits grants to 90 days and supports emergency global revocation through a policy epoch rotation.

## 1.0.0-rc.30 - 2026-07-27

### Ten-minute guided introduction

- Extends the ecosystem-wide visitor allowance from five to ten minutes of active Voice LIVE time.
- Gives one warm, concise notice by voice and on screen when five, three and one minute remain.
- Keeps chat available when Voice LIVE ends and presents Tiempo IA as an optional continuation without automatic charges.
- Preserves unlimited included access for customers during an active contract, membership or service entitlement.

## 1.0.0-rc.29 - 2026-07-27

### One-tap communications UX

- Removes the duplicated four-card launcher, quick-action row and profile controls from the live conversation.
- Keeps audio/video calls in the conversation header and attachment, camera, Voice LIVE and send in the composer.
- Shows microphone or send contextually, so the composer exposes only the action that is useful at that moment.
- Moves identity, need selection, contacts, groups, call history, models and security controls into the menu.

## 1.0.0-rc.28 - 2026-07-27

### Contract access and essential communications

- QuIdentify signed entitlements distinguish public visitors from customers with an active contract, membership or service. Contracted access is included until entitlement expiry and does not consume the five-minute trial or QVit.
- Voice, secure chat, protected file transfer and E2EE/PQC audio/video calls are the four primary interface actions; secondary tools remain in the grid menu.
- Any file format may be selected, but delivery, release, download and QuVault storage fail closed without CDR-provider CLEAN, QuFense ALLOW, verified E2EE/PQC envelope and QuVault STORED receipts.
- Calls expose one-to-one/group audio/video modes and an honest NIAP-aligned, evaluation-ready tunnel profile; no NIAP certification is claimed.

## 1.0.0-rc.27 - 2026-07-27

### Restored

- Opens Aggy automatically on SECQUOIA web surfaces without stealing keyboard focus.
- Attempts to activate the microphone and Voice LIVE immediately after secure service preflight, including the browser's native first-use permission flow.
- Starts the QuGEO-localized greeting as soon as the governed WebRTC data channel is live.
- Synchronizes the compact launcher with the real voice state: animated connecting halo, `EN VIVO` only after connection, and a direct activation fallback when browser permission blocks automatic startup.

### Preserved

- Starts the five-minute free allowance only after a usable WebRTC channel is confirmed.
- Keeps close, minimize and reopen controls available.

## 1.0.0-rc.26 - 2026-07-27

### Fixed

- Starts the five-minute free clock only after the WebRTC data channel is actually open.
- Keeps provider initialization leases pending until the browser confirms a usable live channel.
- Cancels and, when possible, hangs up provider sessions that fail before `EN VIVO`, without consuming free allowance or refund-eligible QVit reservations.

## 1.0.0-rc.25 - 2026-07-27

### Fixed

- Exposes the governed `X-Aggy-Lease-Expires-At` response header through CORS so the browser can validate and enforce the server-side session deadline.
- Prevents a valid OpenAI Realtime WebRTC session from being closed immediately after provider acceptance.

## 1.0.0-rc.24 - 2026-07-27

### Fixed

- Replaces runtime-dependent `FormData` serialization with an explicit standards-compliant multipart body for the OpenAI Realtime unified WebRTC interface.
- Sends exactly two text fields, `sdp` and `session`, matching the current OpenAI server example.
- Adds a pseudonymous OpenAI safety identifier derived from the existing edge usage subject; no IP address or browser fingerprint is forwarded.

## 1.0.0-rc.23 - 2026-07-27

### Fixed

- Sends the WebRTC offer and Realtime session as correctly typed multipart parts (`application/sdp` and `application/json`) to the OpenAI Realtime calls endpoint.
- Releases failed startup reservations and refreshes QuCFA/QVit status instead of leaving the free allowance marked as reserved.
- Exposes a governed cancellation route for pre-provider usage leases.
- Adds bounded structured diagnostics for provider rejection without logging prompts, SDP, API keys or provider messages.

## 1.0.0-rc.22 - 2026-07-27

### Fixed

- Keeps the shared Aggy experience compact on initial page load instead of expanding the communications panel automatically.
- Uses the first explicit launcher click to open the Voice LIVE panel and request microphone access.
- Preserves silent backend, QuGEO, knowledge and usage prewarming before interaction without consuming a provider session.
- Starts the Realtime greeting immediately after the governed audio channel opens.
- Applies the same compact-first behavior to the standalone Marketplace.

## 1.0.0-rc.21 - 2026-07-27

### Fixed

- Prevented the first microphone request from hanging indefinitely when a browser requires a user gesture.
- Auto-starts Voice LIVE only when microphone permission was already granted; otherwise Aggy presents one direct activation action.
- Added bounded microphone and WebRTC channel-open timeouts with actionable permission and retry messages.
- Settles an already-established usage lease when the browser cannot open the audio channel, avoiding an abandoned five-minute session.
- Restored the Voice button label after free allowance or connection failures.

## 1.0.0-rc.20 - 2026-07-27

### Fixed

- Opened the native Aggy Marketplace experience automatically on every fresh page load while preserving minimize, hide and reopen controls.
- Routed the Marketplace Voice action to the real Voice panel and its governed WebRTC start control.
- Removed the stale tab selector that could leave Voice LIVE hidden after a user request.

### Changed

- Added the compact launcher message `Voice LIVE · 5 min gratis` so the free allowance is visible without adding friction.

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
