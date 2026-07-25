# Aggy naming standard

Status: active
Scope: SECQUOIA website, QuMarket, embedded application, dashboards, APIs and current documentation.

## Canonical identity

The sole current product and interface name is **Aggy**.

Use:

- Product: `Aggy`
- Service identifier: `aggy`
- Commercial metric: `AGGY_SERVICE_MONTH`
- Browser namespace: `aggy-*`
- Realtime API route: `/api/aggy/realtime/session`
- Worker and deployment names: `aggy-realtime-*`

Do not use previous customer-facing product names in new interfaces,
dashboards, commercial material or documentation.

## Compatibility

The landing-page router may continue accepting the historical inbound aliases
`quchat`, `quvoice` and `quagent`, but it must resolve them to the canonical
`aggy` product. These aliases are compatibility inputs, not current branding.

Historical exports, signed manifests, certification evidence and immutable
archives retain their original text and hashes. They must not be rewritten.
