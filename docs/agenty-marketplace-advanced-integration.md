# Agenty advanced marketplace integration

Requirement: restore the approved advanced Agenty interface in the persistent floating QuMarket widget.

## Restored areas

- Chat: existing commercial conversation, QuIdentify-gated invitation preparation, local-secret blocking and explicit proof status.
- Voice: browser speech recognition, speech synthesis and `MediaRecorder` voice-note capture held only in memory.
- Files: local size/type inspection and SHA-256 calculation. The mini widget never claims QuSOC `CLEAN`; transfer remains fail-closed until the secure motor is used.
- Models: ten advisory roles, EN/ES/FR/DE/IT/PT, five work modes and a provider catalog. Selection makes zero external calls by itself.
- Security: A-to-Z E2EE/PQC flow, runtime probe and an embedded route to the existing loopback-only secure Agenty motor.

## Evidence rule

Ordinary marketplace messages are labelled `LOCAL - NO E2EE/PQC PROOF`. A green cryptographic check is reserved for the secure motor after the backend confirms encryption, signature, storage, readback and integrity verification. UI selection, local hashing or a successful network connection is not sufficient.

## Runtime boundary

The advanced secure workspace is expected at `http://127.0.0.1:8793/`. It is not started by the static marketplace. Its launcher obtains the access token from QuVault and must not embed that token in HTML, JavaScript, a URL or local storage.

## Rollback

Remove `agenty-marketplace.css`, `agenty-marketplace.js`, their references in `qu-market.html`, and restore the former single-panel assistant markup. No customer, message, file or cryptographic state migration is required because the mini-widget additions do not persist protected payloads.
