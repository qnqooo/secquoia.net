# Aggy communications production readiness

Audit date: 2026-08-02

This document separates implemented controls from production evidence. A visible control or a passing local test is not, by itself, proof that an external provider or a multiuser transport is operational.

## Current status

| Capability | Implemented and tested locally | Production dependency | Production status |
| --- | --- | --- | --- |
| Contextual greeting and environment summary | Host context, role, product and capability metadata; role and process manuals | Current embed must be loaded by every host | Ready for controlled promotion |
| Secure text envelopes | E2EE/PQC envelope creation and tamper rejection | Authenticated peer directory and live message relay | Fail closed until live relay evidence exists |
| Protected file intake | CDR proxy contract, input/output hash checks and client-encryption gate | CDR provider credential and reachable QuHub route | Not operational without provider configuration |
| File receipt and storage | Encrypted reference contract | QuVault ciphertext storage adapter and retrieval authorization | Not operational end to end |
| Individual and group calls | UI and preflight policy gates | Authenticated signaling plus TURN/SFU and peer evidence | Not operational end to end |
| Individual and group video | UI and preflight policy gates | Authenticated signaling plus TURN/SFU and peer evidence | Not operational end to end |
| Realtime consulting voice | Browser client and governed backend session contract | Reachable session endpoint, valid provider secret and browser media permission | Requires live end-to-end validation per host |

## Required A-to-Z acceptance evidence

1. A QuIdentify test identity signs in and receives the intended role and tenant claims.
2. Two authenticated test peers exchange an E2EE/PQC text message; tampered ciphertext is rejected.
3. A benign test file is uploaded, rebuilt by the configured CDR provider, hash-audited by QuFense, encrypted client-side and stored as ciphertext in QuVault.
4. The second peer receives, authorizes, downloads, decrypts and verifies the same file.
5. One-to-one and group audio calls establish through the approved signaling and relay path; unauthorized participants are rejected.
6. One-to-one and group video calls pass the same identity, signaling and relay controls.
7. Aggy starts a Realtime session in COMMAND 360 and QuSpace CRM, names the current environment, summarizes it and offers the correct role manual.
8. QuSOC records correlation IDs and security decisions without storing plaintext payloads or provider secrets.

## Promotion gates

- Configure the CDR provider through secret bindings; never expose its API key in the browser.
- Make the QuHub health route reachable and provision its mesh token.
- Implement and validate the QuVault ciphertext object adapter, retention and authorized retrieval path.
- Operate authenticated signaling and TURN/SFU capacity for audio/video, with abuse limits and tenant isolation.
- Run the acceptance sequence on desktop and mobile, retain redacted telemetry and obtain the human-visible result.

Until those gates have evidence, Aggy must show the affected feature as unavailable and must not bypass sanitization, encryption, identity or policy checks.
