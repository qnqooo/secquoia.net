# Aggy secure messaging — RC.10

## Current scope

Aggy RC.10 supports text conversations between browser devices. Each device creates its own hybrid KEM and signing keys. The room service stores public device bundles and ciphertext envelopes only.

This release does **not** claim:

- externally certified E2EE/PQC;
- QuIdentify/Okta organization identity binding;
- hardware-backed device keys;
- scanned, reconstructed or admitted attachments;
- Glasswall API connectivity;
- stable-production approval or third-party sale readiness.

## Text path

1. The browser sends the draft text to `/api/aggy/messages/sanitize`.
2. QuSOC applies the `AGGY_TEXT_ONLY_V1` policy transiently: quarantine, NFKC normalization, control-character removal, text-only executable-content policy and reconstruction.
3. The sanitation endpoint does not persist the text and returns a bounded admission receipt.
4. The sending device encrypts the sanitized text for each registered recipient using hybrid ML-KEM-768 + X25519, HKDF-SHA-512, AES-256-GCM and XChaCha20-Poly1305.
5. The device signs the envelope with ML-DSA-65 and binds the QuSOC receipt hash into the signed header.
6. The room Durable Object stores the ciphertext envelope in SQLite.
7. A recipient verifies the public-bundle fingerprint, ML-DSA signature, admission receipt, intended recipient and authenticated ciphertext before rendering text.

The server-side sanitation step is a deliberate privacy boundary: the draft exists transiently at QuSOC before the E2EE/PQC protection begins. The room relay and its durable storage never receive plaintext.

## Rooms and identity

Room secrets are generated in the browser. The invitation keeps the secret in the URL fragment (`#aggy-room=...`), which normal HTTP navigation does not send to the server. The server receives only separately derived room and capability values.

RC.10 uses manual out-of-band fingerprint comparison. This authenticates a device key only when users actually compare it through a trusted second channel; it is not a substitute for QuIdentify/Okta organization identity.

## Glasswall adapter

The Worker publishes:

```text
AGGY_GLASSWALL_MODE=STRUCTURE_READY_NOT_CONNECTED
```

The attachment endpoint fails closed with HTTP 503 and reports `externalCallsExecuted: false`. A future Glasswall adapter must be injected behind QuSOC and produce evidence for:

1. quarantine;
2. malware policy;
3. Glasswall CDR reconstruction;
4. sandbox policy where required;
5. structural verification;
6. QuFense decision;
7. QuVault admission receipt.

No file may enter QuVault or be encrypted for delivery until all required stages return a bound PASS result. Provider credentials must be stored as Worker secrets; they must never be included in browser code, repository files, logs or receipts.

## Operational endpoints

- `GET /api/aggy/messages/health`
- `POST /api/aggy/messages/sanitize`
- `PUT /api/aggy/messages/rooms/:roomId/bundles`
- `GET /api/aggy/messages/rooms/:roomId/bundles`
- `POST /api/aggy/messages/rooms/:roomId/messages`
- `GET /api/aggy/messages/rooms/:roomId/messages?deviceId=:deviceId&after=:sequence`
- `POST /api/aggy/messages/attachments` — fail closed until Glasswall integration is validated

## Verification

Run:

```powershell
pnpm run build:aggy-crypto
node --test tests\*.test.mjs
pnpm dlx wrangler deploy --dry-run --config wrangler.aggy.jsonc
```
