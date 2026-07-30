# Aggy advanced marketplace integration

Cryptographic terminology follows [`E2EE-PQC-NAMING-STANDARD.md`](E2EE-PQC-NAMING-STANDARD.md).

Requirement: restore the approved advanced Aggy interface in the persistent floating QuMarket widget.

Current release: `1.2.1` (`stable`, ecosystem hosted). Aggy Core is approved for general availability and third-party integration for Voice LIVE, assistant chat, visitor trials, contract entitlements, Time AI QVit and QuPay LIVE. Its consultant playbook adds evidence-aware commercial and technical guidance. External secure messaging, CDR-protected attachments and E2EE/PQC calls remain preview capabilities and fail closed until their documented infrastructure gates pass. See `aggy-release.json`, `aggy-ga-evidence.json`, `docs/aggy-ga-operations.md`, `docs/aggy-changelog.md`, `docs/aggy-commercial-consultant-playbook.md` and `docs/aggy-versioning-policy.md`.

## Contract and membership access

Public visitors receive ten minutes of Aggy Voice LIVE and must explicitly approve any later QVit minute. Aggy gives one visible and spoken notice when five, three and one minute remain, then preserves chat continuity and offers optional Tiempo IA. Customers with a current contracted service, membership or subscription receive Aggy for the validity of that entitlement. Their sessions do not consume the visitor trial or QVit.

QuIdentify (or the governed contract-activation backend) calls `POST https://aggy.secquoia.group/api/aggy/entitlements/issue` with `X-Aggy-Issuer-Secret` and:

```json
{
  "subject": "stable-QuIdentify-customer-id",
  "contractId": "contract-reference",
  "serviceId": "purchased-service-reference",
  "contractEndsAt": "2027-07-27T23:59:59Z"
}
```

The response is a short, signed access artifact whose validity never exceeds the contract end. The authenticated SECQUOIA surface injects it into `window.SECQUOIA_AGGY_ENTITLEMENT_TOKEN`, a `secquoia-aggy-entitlement` meta element, or session storage key `secquoia.aggy.entitlement`. It must not be stored in local storage, placed in URLs, logged, or embedded in static public HTML. Aggy verifies the signature, issuer, audience, status and expiry on every usage request. Invalid, expired or unverifiable artifacts fail closed.

Long provider connections are bounded to one-hour operational sessions and revalidated against the contract. That technical boundary supports revocation and cost protection; it does not create a visitor-trial cutoff for contracted customers.

## Restored areas

- Chat: existing commercial conversation, QuIdentify-gated invitation preparation, local-secret blocking and explicit proof status.
- Voice: Aggy Realtime over secure WebRTC, using the governed `marin` voice under the public identity “Voz de SQAILE - Acento neutro”. Spanish uses a clear, warm, internationally neutral accent. QuGEO can select another conversation language while Aggy preserves the same vocal identity. Output speed is a moderate `1.08x`, turns use high-eagerness semantic VAD, and the prompt favors short pauses and compact responses without speaking over the user. Each pseudonymous ecosystem user receives 600 seconds of LIVE voice time; payment controls appear only after that allowance ends, and every paid minute requires a new explicit confirmation. Browser `SpeechRecognition`, `speechSynthesis`, `SpeechSynthesisUtterance` and `MediaRecorder` legacy paths are disabled.
- Reading: the last chat response is read by Aggy Realtime. It is treated as quoted data rather than instructions.
- Web knowledge: QuHub retrieves bounded, cached excerpts only from `secquoia.group`, `secquoia.net` and `secquoia.net/qu-market.html`. Website text is reference data, not model instructions. Source URLs are never mandatory and cannot delay or block an answer; Aggy mentions a concise source or link only when the user requests it or it materially helps the next action.
- Files: local size/type inspection and SHA-256 calculation. The mini widget never claims QuSOC `CLEAN`; transfer remains fail-closed until the secure motor is used.
- Models: ten advisory roles, EN/ES/FR/DE/IT/PT, five work modes and a provider catalog. Selection makes zero external calls by itself.
- Security: A-to-Z E2EE/PQC flow, runtime probe and an embedded route to the existing loopback-only secure Aggy motor.

## Evidence rule

Ordinary marketplace messages are labelled `LOCAL - NO E2EE/PQC PROOF`. A green cryptographic check is reserved for the secure motor after the backend confirms encryption, signature, storage, readback and integrity verification. UI selection, local hashing or a successful network connection is not sufficient.

## Runtime boundary

The advanced secure workspace is expected at `http://127.0.0.1:8793/`. It is not started by the static marketplace. Its launcher obtains the access token from QuVault and must not embed that token in HTML, JavaScript, a URL or local storage.

## Rollback

Remove `aggy-marketplace.css`, `aggy-marketplace.js`, their references in `qu-market.html`, and restore the former single-panel assistant markup. No customer, message, file or cryptographic state migration is required because the mini-widget additions do not persist protected payloads.
