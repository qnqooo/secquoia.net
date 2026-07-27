# SECQUOIA cryptography naming standard

## Canonical profile

The canonical name of the Ecosystem cryptographic profile is:

> **E2EE/PQC**

At first use in formal literature, expand it as:

> End-to-end encryption with post-quantum cryptography (E2EE/PQC).

Spanish:

> Cifrado de extremo a extremo con criptografía poscuántica (E2EE/PQC).

After the first expansion, use `E2EE/PQC`.

## Required use

Use `E2EE/PQC` in:

- product interfaces and customer-facing descriptions;
- Aggy messages, security states and evidence labels;
- architecture diagrams and security policies;
- API metadata such as `cryptoProfile`;
- QuFense and QuVault admission or protection profiles;
- technical, commercial and operational documentation.

## Normative identifiers

Do not alter official algorithm identifiers such as `ML-KEM-768`, `ML-DSA-65`, `X25519`, `AES-256-GCM`, `XChaCha20-Poly1305`, NIST publication names or compatibility-bound schema/field names.

When an official algorithm family must be mentioned, describe it as part of the profile, for example:

> NIST PQC algorithms within the E2EE/PQC profile.

## Claims boundary

`E2EE/PQC` is an Ecosystem architecture and policy name. It does not by itself claim:

- NIST, FIPS 140-3, CMVP, CAVP/ACVP or Common Criteria certification;
- independent assessment;
- production approval;
- verified end-to-end protection unless the required runtime evidence exists.

Legacy archives, signed evidence, hashes, audit records and historical release notes retain their original wording for traceability.
