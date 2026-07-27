# Aggy Ecosystem Preview access

`ECOSYSTEM_PREVIEW` is the governed exception to Aggy's ten-minute public Voice LIVE allowance. It is designed for SECQUOIA testing, executive demonstrations and explicitly approved customer projects.

## Security model

- Access is bound to a verified QuIdentify subject, not to an IP address.
- A SuperAdmin issues a signed, expiring Aggy entitlement through `POST /api/aggy/entitlements/issue`.
- Preview grants require `grantId`, `projectId`, `reason`, `validUntil` and `accessProfile: "ECOSYSTEM_PREVIEW"`.
- The issuer must authenticate with the server-side issuer secret and the verified `SUPERADMIN` role. Neither value belongs in browser code.
- Preview grants last no more than 90 days. They can be renewed after review.
- Rotating `AGGY_PREVIEW_POLICY_EPOCH` invalidates every outstanding preview grant immediately. Individual grants should normally use short expirations until the SuperAdmin dashboard adds a dedicated revocation registry.
- Every issuance produces a structured audit event without logging the bearer token.

An IP can be recorded as contextual QuGEO/QuAudit evidence, but it must never be the sole authorization factor. Dynamic addresses, VPNs, carrier NAT and shared corporate networks make IP-only allowlists unsafe.

## Issuance contract

The QuIdentify/SuperAdmin backend sends:

```http
POST https://aggy.secquoia.group/api/aggy/entitlements/issue
X-Aggy-Issuer-Secret: [server-side secret]
X-QuIdentify-Role: SUPERADMIN
Content-Type: application/json
```

```json
{
  "accessProfile": "ECOSYSTEM_PREVIEW",
  "subject": "quidentify:verified-subject",
  "grantId": "preview-unique-id",
  "projectId": "secquoia-internal-testing",
  "reason": "Cross-site product validation",
  "validUntil": "2026-08-26T23:59:59Z"
}
```

The signed bearer entitlement is delivered after QuIdentify authentication. It must not appear in a query string, analytics event or log. The SECQUOIA surface supplies it to Aggy through the existing in-memory/meta/session entitlement channel, and every usage request is revalidated server-side.

## User experience

- Public visitor: sees the ten-link countdown and consumes the shared ten-minute allowance.
- Active contract: sees `Voz LIVE · incluida`; no visitor time or QVit is consumed.
- Approved preview: sees `Preview · sin consumo`; the countdown is hidden and no visitor time or QVit is consumed.
- Expired, altered or policy-epoch-mismatched passes fail closed and return to the normal visitor policy only after a fresh unauthenticated request.

## SuperAdmin dashboard contract

The future dashboard should expose: QuIdentify subject search, project, reason, expiration, grant status, issuer, issuance time, last validation and an emergency `Revoke all Preview passes` action that rotates the policy epoch. It must never display signing secrets or full bearer tokens.
