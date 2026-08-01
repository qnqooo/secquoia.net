import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source=await readFile(new URL('../workers/qupay-aggy-checkout.js',import.meta.url),'utf8');
const worker=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const identitySecret='unit-test-quidentify-checkout-secret-32-bytes-minimum';
const sharedSecret='unit-test-aggy-shared-secret-32-bytes-minimum';
const identityReceipt=({packId,walletReference,now=Math.floor(Date.now()/1000),jti='J'.repeat(32)}={})=>{
  const payload=Buffer.from(JSON.stringify({schema:'secquoia.quidentify.aggy-checkout-receipt.v1',iss:'QuIdentify',aud:'QuPay',purpose:'AGGY_TIME_AI_CHECKOUT',subjectFingerprint:'a'.repeat(64),packId,walletReference,returnOrigin:'https://secquoia.net',mfa:true,jti,iat:now,nbf:now-5,exp:now+300})).toString('base64url');
  return `${payload}.${createHmac('sha256',identitySecret).update(payload).digest('hex')}`;
};

test('QuPay exposes only governed QVit packs',()=>{
  assert.deepEqual(Object.keys(worker.PACKS),['qvit-ai-credit-1','qvit-ai-credit-5','qvit-ai-credit-10','qvit-ai-credit-25','qvit-ai-credit-100','qvit-ai-credit-500']);
  assert.equal(worker.PACKS['qvit-ai-credit-1'].usdCents,100);
  assert.equal(worker.PACKS['qvit-ai-credit-1'].qvitAmount,1_000_000);
  assert.equal(worker.PACKS['qvit-ai-credit-5'].usdCents,500);
  assert.equal(worker.PACKS['qvit-ai-credit-5'].qvitAmount,5_000_000);
  assert.equal(worker.PACKS['qvit-ai-credit-10'].usdCents,1000);
  assert.equal(worker.PACKS['qvit-ai-credit-10'].qvitAmount,10_000_000);
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

test('Checkout never calls Stripe when QuFense denies the intent',async()=>{
  const originalFetch=globalThis.fetch;
  let stripeCalls=0;
  globalThis.fetch=async()=>{stripeCalls++;throw new Error('Stripe must not be called')};
  try{
    const response=await worker.default.fetch(new Request('https://pay.secquoia.group/v1/qupay/checkout',{
      method:'POST',
      headers:{Origin:'https://secquoia.net','Content-Type':'application/json'},
      body:JSON.stringify({
        packId:'qvit-ai-credit-25',
        walletReference:'w'.repeat(43),
        identityReceipt:identityReceipt({packId:'qvit-ai-credit-25',walletReference:'w'.repeat(43)})
      })
    }),{
      STRIPE_RESTRICTED_KEY:'rk_live_test',
      STRIPE_WEBHOOK_SECRET:'whsec_test',
      AGGY_QUPAY_WEBHOOK_SECRET:sharedSecret,
      QUIDENTIFY_CHECKOUT_RECEIPT_SECRET:identitySecret,
      QUFENSE_AUTHORITY_FINGERPRINT:'e17334292df7d6f72b3395109e401b11',
      QUFENSE:{fetch:async()=>new Response(JSON.stringify({decision:'DENY',reason:'POLICY_DENIED'}),{status:403,headers:{'Content-Type':'application/json'}})}
    });
    assert.equal(response.status,403);
    assert.equal((await response.json()).failClosed,true);
    assert.equal(stripeCalls,0);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Checkout rejects forged legacy identity markers before QuFense or Stripe',async()=>{
  const originalFetch=globalThis.fetch;
  let stripeCalls=0;
  let qufenseCalls=0;
  globalThis.fetch=async()=>{stripeCalls++;return new Response('{}',{status:500})};
  try{
    const response=await worker.default.fetch(new Request('https://pay.secquoia.group/v1/qupay/checkout?quidentify=verified',{
      method:'POST',
      headers:{Origin:'https://secquoia.net','Content-Type':'application/json'},
      body:JSON.stringify({packId:'qvit-ai-credit-1',walletReference:'w'.repeat(43),quidentify:'verified'})
    }),{
      STRIPE_RESTRICTED_KEY:'rk_live_test',
      STRIPE_WEBHOOK_SECRET:'whsec_test',
      AGGY_QUPAY_WEBHOOK_SECRET:sharedSecret,
      QUIDENTIFY_CHECKOUT_RECEIPT_SECRET:identitySecret,
      QUFENSE_AUTHORITY_FINGERPRINT:'e17334292df7d6f72b3395109e401b11',
      QUFENSE:{fetch:async()=>{qufenseCalls++;return new Response('{}',{status:500})}}
    });
    assert.equal(response.status,401);
    assert.equal(stripeCalls,0);
    assert.equal(qufenseCalls,0);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('QuPay rejects a correctly signed identity receipt with incomplete timestamps',async()=>{
  const now=Math.floor(Date.now()/1000);
  const payload=Buffer.from(JSON.stringify({schema:'secquoia.quidentify.aggy-checkout-receipt.v1',iss:'QuIdentify',aud:'QuPay',purpose:'AGGY_TIME_AI_CHECKOUT',subjectFingerprint:'a'.repeat(64),packId:'qvit-ai-credit-1',walletReference:'w'.repeat(43),returnOrigin:'https://secquoia.net',mfa:true,jti:'J'.repeat(32),iat:now,exp:now+300})).toString('base64url');
  const token=`${payload}.${createHmac('sha256',identitySecret).update(payload).digest('hex')}`;
  await assert.rejects(()=>worker.verifyQuIdentifyCheckoutReceipt(token,identitySecret,{packId:'qvit-ai-credit-1',walletReference:'w'.repeat(43)}),/inactive/);
});

test('QuFense receipt validation binds order, amount, digest, authority and expiry',()=>{
  const intent={
    packId:'qvit-ai-credit-25',
    pack:worker.PACKS['qvit-ai-credit-25'],
    walletReference:'w'.repeat(43),
    orderRef:'order-valid-1234',
    identity:{jti:'J'.repeat(32),subjectFingerprint:'a'.repeat(64)}
  };
  const payloadDigest='a'.repeat(64);
  const now=2_000_000_000_000;
  const receipt={
    schema:'sqaile.qufense.checkout-authorization.v1',
    decision:'ALLOW',
    source:'qupay',
    provider:'stripe',
    action:'stripe.checkout.session.create',
    purpose:'live_qvit_checkout',
    orderRef:intent.orderRef,
    packId:intent.packId,
    amount:2500,
    currency:'usd',
    payloadDigest,
    externalTransportEncrypted:true,
    providerAuthentication:'STRIPE_RESTRICTED_LIVE_KEY',
    authorizationProfile:'QF-CHECKOUT-AUTHZ-PQC-1',
    providerPayloadPqcClaimed:false,
    moduleValidationClaimed:false,
    evidenceId:'QFP-test',
    issuedAt:new Date(now).toISOString(),
    expiresAt:new Date(now+15_000).toISOString()
  };
  const document={
    schema:'sqaile.qufense.signed-flow-receipt.v1',
    authority:'QuFense',
    authorityFingerprint:'e17334292df7d6f72b3395109e401b11',
    primarySignature:'p'.repeat(65),
    conservativeSignature:'s'.repeat(65),
    moduleValidationClaimed:false,
    receipt
  };
  const expected={...intent,payloadDigest};
  assert.equal(worker.validQuFenseReceipt(document,expected,document.authorityFingerprint,now),true);
  assert.equal(worker.validQuFenseReceipt({...document,receipt:{...receipt,amount:2501}},expected,document.authorityFingerprint,now),false);
  assert.equal(worker.validQuFenseReceipt(document,expected,'f'.repeat(32),now),false);
  assert.equal(worker.validQuFenseReceipt(document,expected,document.authorityFingerprint,now+30_000),true);
  assert.equal(worker.validQuFenseReceipt(document,expected,document.authorityFingerprint,now+45_001),false);
});

test('Authorized Checkout carries QuFense evidence into Stripe metadata',async()=>{
  const intent={
    packId:'qvit-ai-credit-25',
    pack:worker.PACKS['qvit-ai-credit-25'],
    walletReference:'w'.repeat(43),
    orderRef:'order-evidence-1234',
    identity:{jti:'J'.repeat(32),subjectFingerprint:'a'.repeat(64)}
  };
  const authorityFingerprint='e17334292df7d6f72b3395109e401b11';
  const env={
    QUFENSE_AUTHORITY_FINGERPRINT:authorityFingerprint,
    QUFENSE:{
      fetch:async(_url,init)=>{
        const request=JSON.parse(init.body);
        const now=Date.now();
        return new Response(JSON.stringify({
          schema:'sqaile.qufense.signed-flow-receipt.v1',
          authority:'QuFense',
          authorityFingerprint,
          primarySignature:'p'.repeat(65),
          conservativeSignature:'s'.repeat(65),
          moduleValidationClaimed:false,
          receipt:{
            schema:'sqaile.qufense.checkout-authorization.v1',
            decision:'ALLOW',
            ...request,
            authorizationProfile:'QF-CHECKOUT-AUTHZ-PQC-1',
            providerPayloadPqcClaimed:false,
            moduleValidationClaimed:false,
            evidenceId:'QFP-checkout-test',
            issuedAt:new Date(now).toISOString(),
            expiresAt:new Date(now+15_000).toISOString()
          }
        }),{status:200,headers:{'Content-Type':'application/json'}});
      }
    }
  };
  const result=await worker.authorizeCheckoutWithQuFense(intent,env);
  assert.equal(result.ok,true);
  const form=worker.stripeForm(intent,result.document);
  assert.equal(form.get('metadata[qufense_evidence_id]'),'QFP-checkout-test');
  assert.equal(form.get('metadata[qufense_authority_fingerprint]'),authorityFingerprint);
  assert.equal(form.get('metadata[qufense_payload_digest]'),result.payloadDigest);
  assert.equal(form.get('metadata[quidentify_receipt_id]'),'J'.repeat(32));
  assert.equal(form.get('success_url'),'https://secquoia.net/aggy-time-ai.html?payment=success&session_id={CHECKOUT_SESSION_ID}');
  assert.equal(form.get('cancel_url'),'https://secquoia.net/aggy-time-ai.html?payment=cancelled');
});

test('Paid Checkout confirmation returns a signed wallet binding and 20-minute USD 5 pack',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>{
    if(String(url).startsWith('https://aggy.secquoia.group/'))return new Response(JSON.stringify({credited:true,duplicate:false}),{status:200,headers:{'Content-Type':'application/json'}});
    assert.match(String(url),/api\.stripe\.com\/v1\/checkout\/sessions\/cs_live_/);
    return new Response(JSON.stringify({
      id:'cs_live_paid_confirmation_123456',
      livemode:true,
      payment_status:'paid',
      amount_total:500,
      currency:'usd',
      metadata:{
        schema:'secquoia.qupay.aggy-qvit.v1',
        pack_id:'qvit-ai-credit-5',
        wallet_reference:'w'.repeat(43),
        qvit_amount:'5000000',
        order_ref:'qid-'+('J'.repeat(32)),
        quidentify_receipt_id:'J'.repeat(32),
        quidentify_subject_fingerprint:'a'.repeat(64)
      }
    }),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try{
    const capability=await worker.issueCheckoutConfirmationCapability({sessionId:'cs_live_paid_confirmation_123456',walletReference:'w'.repeat(43),identityReceiptId:'J'.repeat(32)},sharedSecret);
    const response=await worker.default.fetch(new Request('https://pay.secquoia.group/v1/qupay/checkout/confirm?session_id=cs_live_paid_confirmation_123456',{
      headers:{Origin:'https://secquoia.net','X-QuPay-Confirmation':capability}
    }),{
      STRIPE_RESTRICTED_KEY:'rk_live_test',
      AGGY_QUPAY_WEBHOOK_SECRET:sharedSecret
    });
    const body=await response.json();
    assert.equal(response.status,200);
    assert.equal(body.status,'PAID');
    assert.equal(body.amountUsd,5);
    assert.equal(body.qvitAmount,5_000_000);
    assert.equal(body.voiceLiveMinutes,20);
    assert.equal(body.creditStatus,'CREDITED');
    assert.match(body.walletBinding,/^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Health reports each secret gate without exposing values',async()=>{
  const response=await worker.default.fetch(new Request('https://qupay.secquoia.group/v1/qupay/health'),{
    STRIPE_RESTRICTED_KEY:'unit-test-restricted-key',
    STRIPE_WEBHOOK_SECRET:'unit-test-webhook-key',
    AGGY_QUPAY_WEBHOOK_SECRET:'shared_test',
    QUIDENTIFY_CHECKOUT_RECEIPT_SECRET:identitySecret,
    QUIDENTIFY_CHECKOUT_RECEIPT_SECRET:identitySecret,
    QUFENSE:{fetch:async(_url,init)=>{
      assert.equal(_url,'https://qufense.internal/readyz');
      assert.equal(init.method,'GET');
      return new Response(JSON.stringify({
        ready:true,
        productionReady:true,
        flowReceiptAuthority:{fingerprint:'e17334292df7d6f72b3395109e401b11'}
      }),{status:200});
    }},
    QUFENSE_AUTHORITY_FINGERPRINT:'e17334292df7d6f72b3395109e401b11'
  });
  const body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.ready,true);
  assert.deepEqual(body.transportBoundary,{
    secquoiaGovernance:'QUFENSE_END_TO_END_WITHIN_SECQUOIA',
    internalCryptoProfile:'E2EE/PQC',
    stripeHandoff:'HTTPS_MANAGED_BY_STRIPE',
    stripeNativePqcClaimed:false
  });
  assert.doesNotMatch(JSON.stringify(body),/unit-test-restricted-key|unit-test-webhook-key|shared_test/);
});

test('Health reports degraded when the QuFense runtime rejects its mesh credential',async()=>{
  const response=await worker.default.fetch(new Request('https://qupay.secquoia.group/v1/qupay/health'),{
    STRIPE_RESTRICTED_KEY:'unit-test-restricted-key',
    STRIPE_WEBHOOK_SECRET:'unit-test-webhook-key',
    AGGY_QUPAY_WEBHOOK_SECRET:'shared_test',
    QUFENSE:{fetch:async()=>new Response(JSON.stringify({error:'mesh_unauthorized'}),{status:401})},
    QUFENSE_AUTHORITY_FINGERPRINT:'e17334292df7d6f72b3395109e401b11'
  });
  const body=await response.json();
  assert.equal(response.status,503);
  assert.equal(body.ready,false);
  assert.equal(body.checks.qufenseServiceBinding,true);
  assert.equal(body.checks.qufenseRuntimeReady,false);
});
