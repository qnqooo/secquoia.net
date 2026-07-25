# Aggy Realtime Voice

Aggy uses OpenAI Realtime speech-to-speech over WebRTC. The browser sends its SDP
offer to a same-origin Cloudflare Worker; only the Worker calls OpenAI with the
standard API key. No OpenAI credential is sent to or stored by the browser.

## Runtime configuration

- Current reviewed model: `gpt-realtime`
- Voice: `marin`
- Turn detection: `semantic_vad` with automatic eagerness
- Barge-in: enabled with `interrupt_response`

`OPENAI_REALTIME_MODEL` is deliberately controlled by the Worker. The browser
cannot choose or override the provider model.

## Deployment gate

Deployment and paid API use require explicit owner approval. Before an approved
deployment:

1. Review the current OpenAI model catalog and update `OPENAI_REALTIME_MODEL` only
   after a regression check. “Always latest” is an operational policy, not a safe
   blind auto-upgrade.
2. Configure the Worker secret without writing it to the repository:
   `wrangler secret put OPENAI_API_KEY --config wrangler.aggy.jsonc`
3. Deploy the Worker route:
   `wrangler deploy --config wrangler.aggy.jsonc`
4. Test real audio in Spanish and English for turn completion, interruptions,
   noise, latency, and naturalness.

The local browser speech API remains a clearly labelled fallback. Its voice
quality depends on the operating system and cannot be represented as OpenAI
Realtime.
