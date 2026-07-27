# Aggy Realtime Voice

Aggy uses OpenAI Realtime speech-to-speech over WebRTC. The browser sends its SDP
offer to a same-origin Cloudflare Worker; only the Worker calls OpenAI with the
standard API key. No OpenAI credential is sent to or stored by the browser.

## Runtime configuration

- Current reviewed model: `gpt-realtime-2.1`
- Voice: `marin`
- Turn detection: `semantic_vad` with automatic eagerness
- Barge-in: enabled with `interrupt_response`

`OPENAI_REALTIME_MODEL` is deliberately controlled by the Worker. The browser
cannot choose or override the provider model.

## QuCFA, QVit and QuPay usage control

- A subject receives at most 600 seconds of included active voice time.
- During a visitor lease, Aggy gives one visible and spoken notice when 300, 180 and 60 seconds remain.
- When the visitor allowance ends, chat remains available and Tiempo IA is offered as an explicit opt-in continuation; no automatic charge is made.
- Continuing requires one prepaid `Aggy Minute` microlease of 60 seconds.
- The RC16 public-rate-card estimate reserves `240,000 QVit` per minute. The
  value includes a USD 0.15 provider-cost ceiling and the governed 35% target
  margin. It is versioned and must be reviewed when OpenAI changes pricing.
- QuOptio policy `2026-07-26.1` keeps the latest approved Realtime voice model,
  prohibits silent model downgrades, trims context with a retention ratio,
  uses semantic VAD and stops at 90% of the provider-cost reserve.
- The Worker obtains an atomic lease from `AggyUsageMeter` before it requests
  OpenAI SDP. A paid lease debits QVit before provider access and never permits
  a negative balance.
- `response.done` usage is deduplicated, normalized and quoted by QuCFA. The
  resulting provider cost, QCU, customer QVit and rate-card reference are stored
  as QuAudit evidence.
- Default limits are 15 paid minutes per day and 150 per month for each edge
  subject. A missing meter, expired lease, missing heartbeat or insufficient
  balance fails closed.
- QVit credit is accepted only from a confirmed, HMAC-signed and idempotent
  QuPay webhook. Configure `AGGY_QUPAY_WEBHOOK_SECRET` as a Worker secret; never
  put it in JavaScript or the Wrangler variables section.

The WebRTC browser receives no OpenAI key. RC16 enforces leases at session
creation and in the official client. A future provider-side sideband controller
should be added before claiming tamper-proof forced termination for modified
third-party clients.

## Deployment gate

Deployment and paid API use require explicit owner approval. Before an approved
deployment:

1. Review the current OpenAI model catalog and update `OPENAI_REALTIME_MODEL` only
   after a regression check. “Always latest” is an operational policy, not a safe
   blind auto-upgrade.
2. Configure the Worker secret without writing it to the repository:
   `wrangler secret put OPENAI_API_KEY --config wrangler.aggy.jsonc`
   and configure `AGGY_QUPAY_WEBHOOK_SECRET` when QuPay production webhook
   delivery is ready.
3. Deploy the Worker route:
   `wrangler deploy --config wrangler.aggy.jsonc`
4. Test real audio in Spanish and English for turn completion, interruptions,
   noise, latency, and naturalness.

The legacy browser speech API remains disabled and cannot be represented as
OpenAI Realtime.
