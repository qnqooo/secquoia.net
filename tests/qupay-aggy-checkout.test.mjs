import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source=await readFile(new URL('../workers/qupay-aggy-checkout.js',import.meta.url),'utf8');
const worker=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('QuPay exposes only governed QVit packs',()=>{
  assert.deepEqual(Object.keys(worker.PACKS),['qvit-ai-credit-25','qvit-ai-credit-100','qvit-ai-credit-500']);
  assert.equal(worker.PACKS['qvit-ai-credit-25'].usdCents,2500);
  assert.equal(worker.PACKS['qvit-ai-credit-25'].qvitAmount,25_000_000);
});

test('Stripe signature verification enforces HMAC and replay tolerance',async()=>{
  const raw='{"id":"evt_live","livemode":true}';
  const timestamp=1785124800;
  const secret='unit-test-signing-key';
  const signature=createHmac('sha256',secret).update(`${timestamp}.${raw}`).digest('hex');
  assert.equal(await worker.verifyStripeSignature(raw,`t=${timestamp},v1=${signature}`,secret,timestamp),true);
  assert.equal(await worker.verifyStripeSignature(raw,`t=${timestamp-301},v1=${signature}`,secret,timestamp),false);
});

test('Checkout fails closed when LIVE secrets are absent',async()=>{
  const response=await worker.default.fetch(new Request('https://qupay.secquoia.group/v1/qupay/checkout',{
    method:'POST',
    headers:{Origin:'https://secquoia.net','Content-Type':'application/json'},
    body:'{}'
  }),{});
  assert.equal(response.status,503);
  assert.equal((await response.json()).failClosed,true);
});

test('Health reports each secret gate without exposing values',async()=>{
  const response=await worker.default.fetch(new Request('https://qupay.secquoia.group/v1/qupay/health'),{
    STRIPE_RESTRICTED_KEY:'unit-test-restricted-key',
    STRIPE_WEBHOOK_SECRET:'unit-test-webhook-key',
    AGGY_QUPAY_WEBHOOK_SECRET:'shared_test'
  });
  const body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.ready,true);
  assert.doesNotMatch(JSON.stringify(body),/unit-test-restricted-key|unit-test-webhook-key|shared_test/);
});
