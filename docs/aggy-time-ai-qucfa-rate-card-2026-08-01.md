# Aggy Time AI — QuCFA rate-card decision

Date: 2026-08-01  
Status: implementation rate card; subject to the stale-rate-card fail-closed
control already enforced by QuOptio.

## Decision

QuCFA approves a simple retail conversion of **USD 1 = 5 minutes of Aggy Voice
LIVE** for the published packages below. QVit remains USD-denominated at
1,000,000 QVit per USD; one governed Aggy minute now reserves 200,000 QVit.

| Payment | Voice LIVE | QVit |
| ---: | ---: | ---: |
| USD 1 | 5 min | 1,000,000 |
| USD 5 | 25 min | 5,000,000 |
| USD 10 | 50 min | 10,000,000 |
| USD 25 | 125 min | 25,000,000 |
| USD 50 | 250 min | 50,000,000 |
| USD 100 | 500 min | 100,000,000 |
| USD 500 | 2,500 min | 500,000,000 |
| USD 1,000 | 5,000 min | 1,000,000,000 |

## Guardrails

- Current provider model: `gpt-realtime-2.1`; no silent downgrade.
- OpenAI rate card: USD 32/1M audio input tokens, USD 64/1M audio output
  tokens, USD 4/1M text input tokens and USD 24/1M text output tokens.
- Provider reserve: USD 0.125 per paid minute.
- Customer debit: 200,000 QVit per paid minute after the 35% governed
  gross-margin calculation and 10,000-QVit commercial rounding.
- QuOptio hard stop: 90% of the provider reserve, with reservation before
  provider access and no negative QVit balance.
- Conservative checkout envelope used for package viability: 4.5% of the
  payment plus USD 0.30. This is an internal stress assumption, not a claim
  about the contracted Stripe rate.
- The USD 1 package is the limiting case: USD 1.000 revenue less USD 0.625
  provider reserve and USD 0.345 processor envelope leaves USD 0.030. Larger
  packs have a wider positive buffer because the fixed payment cost is diluted.

Any provider-rate increase, processor fee above this envelope, margin-policy
change or stale provider rate card must fail closed and trigger a new QuCFA
approval before changing the customer conversion.
