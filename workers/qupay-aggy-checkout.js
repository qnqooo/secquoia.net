const RELEASE='1.3.0-rc.2';
const STRIPE_API='https://api.stripe.com/v1';
const AGGY_CREDIT_ENDPOINT='https://aggy.secquoia.group/api/aggy/usage/qupay-credit';
const STRIPE_TRANSPORT_BOUNDARY=Object.freeze({
  secquoiaGovernance:'QUFENSE_END_TO_END_WITHIN_SECQUOIA',
  internalCryptoProfile:'E2EE/PQC',
  stripeHandoff:'HTTPS_MANAGED_BY_STRIPE',
  stripeNativePqcClaimed:false
});
const ALLOWED_ORIGINS=new Set(['https://secquoia.net','https://www.secquoia.net']);
const TIME_AI_QVIT_PER_MINUTE=200_000;
const TIME_AI_PROVIDER_RESERVE_USD_PER_MINUTE=.125;
// Conservative QuCFA envelope, not a claim about SECQUOIA's negotiated Stripe
// rate. It protects the smallest pack against a 4.5% + USD 0.30 payment cost.
const TIME_AI_PROCESSOR_PERCENT_BPS=450;
const TIME_AI_PROCESSOR_FIXED_USD=.30;
const PACKS=Object.freeze({
  'qvit-ai-credit-1':Object.freeze({usdCents:100,qvitAmount:1_000_000,label:'Aggy Time AI starter · $1'}),
  'qvit-ai-credit-5':Object.freeze({usdCents:500,qvitAmount:5_000_000,label:'Aggy Time AI · $5'}),
  'qvit-ai-credit-10':Object.freeze({usdCents:1000,qvitAmount:10_000_000,label:'Aggy Time AI · $10'}),
  'qvit-ai-credit-25':Object.freeze({usdCents:2500,qvitAmount:25_000_000,label:'QVit AI resource credit · $25'}),
  'qvit-ai-credit-50':Object.freeze({usdCents:5000,qvitAmount:50_000_000,label:'QVit AI resource credit · $50'}),
  'qvit-ai-credit-100':Object.freeze({usdCents:10_000,qvitAmount:100_000_000,label:'QVit AI resource credit · $100'}),
  'qvit-ai-credit-500':Object.freeze({usdCents:50_000,qvitAmount:500_000_000,label:'QVit AI resource credit · $500'}),
  'qvit-ai-credit-1000':Object.freeze({usdCents:100_000,qvitAmount:1_000_000_000,label:'QVit AI resource credit · $1000'})
});
const timeAiPackEconomics=pack=>{
  const grossUsd=Number(pack?.usdCents||0)/100;
  const voiceLiveMinutes=Math.floor(Number(pack?.qvitAmount||0)/TIME_AI_QVIT_PER_MINUTE);
  const providerReserveUsd=voiceLiveMinutes*TIME_AI_PROVIDER_RESERVE_USD_PER_MINUTE;
  const processorReserveUsd=grossUsd*TIME_AI_PROCESSOR_PERCENT_BPS/10_000+TIME_AI_PROCESSOR_FIXED_USD;
  const contributionUsd=grossUsd-providerReserveUsd-processorReserveUsd;
  return Object.freeze({
    grossUsd,
    voiceLiveMinutes,
    providerReserveUsd:Number(providerReserveUsd.toFixed(3)),
    processorReserveUsd:Number(processorReserveUsd.toFixed(3)),
    contributionUsd:Number(contributionUsd.toFixed(3)),
    viable:contributionUsd>=0
  });
};
const encoder=new TextEncoder();
const cors=request=>{
  const origin=request.headers.get('Origin');
  return ALLOWED_ORIGINS.has(origin)?{
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Idempotency-Key, X-QuIdentify-Receipt, X-QuPay-Confirmation',
    'Access-Control-Max-Age':'86400',
    Vary:'Origin'
  }:{};
};
const json=(body,status,request)=>new Response(JSON.stringify(body),{
  status,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(request)}
});
const validWallet=value=>/^[A-Za-z0-9_-]{43}$/.test(String(value||''));
const validOrder=value=>/^[A-Za-z0-9_-]{8,100}$/.test(String(value||''));
const timingEqual=(left,right)=>{
  if(left.length!==right.length)return false;
  let mismatch=0;
  for(let index=0;index<left.length;index++)mismatch|=left[index]^right[index];
  return mismatch===0;
};
const hex=bytes=>[...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
const hmacHex=async(secret,value)=>{
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));
};
const base64Url=value=>{
  const bytes=encoder.encode(String(value));
  let binary='';
  bytes.forEach(byte=>binary+=String.fromCharCode(byte));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
};
const decodeBase64Url=value=>{
  const normalized=String(value||'').replaceAll('-','+').replaceAll('_','/');
  const padded=normalized.padEnd(Math.ceil(normalized.length/4)*4,'=');
  return Uint8Array.from(atob(padded),character=>character.charCodeAt(0));
};
const verifyQuIdentifyCheckoutReceipt=async(token,secret,{packId,walletReference,now=Date.now()}={})=>{
  if(!secret||encoder.encode(String(secret)).byteLength<32)throw new Error('quidentify_checkout_verifier_not_configured');
  const match=String(token||'').match(/^([A-Za-z0-9_-]{80,1600})\.([a-f0-9]{64})$/i);
  if(!match)throw new Error('quidentify_checkout_receipt_required');
  const expected=await hmacHex(secret,match[1]);
  if(!timingEqual(encoder.encode(expected),encoder.encode(match[2].toLowerCase())))throw new Error('invalid_quidentify_checkout_receipt');
  let payload;
  try{payload=JSON.parse(new TextDecoder().decode(decodeBase64Url(match[1])))}catch{throw new Error('invalid_quidentify_checkout_receipt')}
  const epoch=Math.floor(now/1000);
  const iat=Number(payload.iat),nbf=Number(payload.nbf),exp=Number(payload.exp);
  if(
    payload.schema!=='secquoia.quidentify.aggy-checkout-receipt.v1'||
    payload.iss!=='QuIdentify'||payload.aud!=='QuPay'||payload.purpose!=='AGGY_TIME_AI_CHECKOUT'||payload.mfa!==true||
    payload.packId!==packId||payload.walletReference!==walletReference||payload.returnOrigin!=='https://secquoia.net'||
    !/^[a-f0-9]{64}$/.test(String(payload.subjectFingerprint||''))||!/^[A-Za-z0-9_-]{32}$/.test(String(payload.jti||''))||
    ![iat,nbf,exp].every(Number.isFinite)||iat>epoch+5||nbf>epoch||exp<=epoch||exp<=iat||exp-iat>300
  )throw new Error('inactive_or_mismatched_quidentify_checkout_receipt');
  return Object.freeze(payload);
};
const issueCheckoutConfirmationCapability=async({sessionId,walletReference,identityReceiptId},secret,now=Date.now())=>{
  const payload=base64Url(JSON.stringify({schema:'secquoia.qupay.checkout-confirmation-capability.v1',sessionId,walletReference,identityReceiptId,iat:now,exp:now+2*60*60*1000}));
  return `${payload}.${await hmacHex(secret,payload)}`;
};
const verifyCheckoutConfirmationCapability=async(token,secret,{sessionId,now=Date.now()}={})=>{
  const match=String(token||'').match(/^([A-Za-z0-9_-]{80,1200})\.([a-f0-9]{64})$/i);
  if(!match)throw new Error('checkout_confirmation_capability_required');
  const expected=await hmacHex(secret,match[1]);
  if(!timingEqual(encoder.encode(expected),encoder.encode(match[2].toLowerCase())))throw new Error('invalid_checkout_confirmation_capability');
  let payload;
  try{payload=JSON.parse(new TextDecoder().decode(decodeBase64Url(match[1])))}catch{throw new Error('invalid_checkout_confirmation_capability')}
  if(payload.schema!=='secquoia.qupay.checkout-confirmation-capability.v1'||payload.sessionId!==sessionId||!validWallet(payload.walletReference)||!/^[A-Za-z0-9_-]{32}$/.test(String(payload.identityReceiptId||''))||Number(payload.exp)<=now||Number(payload.exp)-Number(payload.iat)>2*60*60*1000)throw new Error('inactive_or_invalid_checkout_confirmation_capability');
  return payload;
};
const issueWalletBinding=async(object,env,now=Date.now())=>{
  const metadata=object?.metadata||{};
  const packId=String(metadata.pack_id||'');
  const pack=PACKS[packId];
  const walletReference=String(metadata.wallet_reference||'');
  if(
    object?.livemode!==true||
    object?.payment_status!=='paid'||
    !pack||
    !validWallet(walletReference)||
    Number(object.amount_total)!==pack.usdCents||
    String(object.currency||'').toLowerCase()!=='usd'||
    Number(metadata.qvit_amount)!==pack.qvitAmount||
    !/^[A-Za-z0-9_-]{32}$/.test(String(metadata.quidentify_receipt_id||''))||
    !/^[a-f0-9]{64}$/.test(String(metadata.quidentify_subject_fingerprint||''))
  )throw new Error('checkout_not_confirmed');
  const payload=base64Url(JSON.stringify({
    schema:'secquoia.qupay.aggy-wallet-binding.v1',
    walletReference,
    packId,
    providerSessionId:String(object.id||''),
    identityReceiptId:String(metadata.quidentify_receipt_id||''),
    subjectFingerprint:String(metadata.quidentify_subject_fingerprint||''),
    issuedAt:now,
    expiresAt:now+180*24*60*60*1000
  }));
  return `${payload}.${await hmacHex(env.AGGY_QUPAY_WEBHOOK_SECRET,payload)}`;
};
const sha256Hex=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const QUFENSE_RECEIPT_LIFETIME_MS=15_000;
const QUFENSE_SIGNATURE_TRANSIT_GRACE_MS=30_000;
const checkoutDigestInput=({packId,pack,walletReference,orderRef,identity})=>JSON.stringify({
  schema:'secquoia.qupay.checkout-intent.v1',
  source:'qupay',
  provider:'stripe',
  packId,
  amount:pack.usdCents,
  currency:'usd',
  qvitAmount:pack.qvitAmount,
  walletReference,
  orderRef,
  identityReceiptId:identity?.jti||null,
  subjectFingerprint:identity?.subjectFingerprint||null
});
const qufenseReceiptInvalidReason=(document,expected,authorityFingerprint,now=Date.now())=>{
  const receipt=document?.receipt;
  const issuedAt=Date.parse(receipt?.issuedAt);
  const expiresAt=Date.parse(receipt?.expiresAt);
  const checks=[
    ['document_schema',document?.schema==='sqaile.qufense.signed-flow-receipt.v1'],
    ['authority',document?.authority==='QuFense'],
    ['authority_fingerprint',document?.authorityFingerprint===authorityFingerprint],
    ['primary_signature',typeof document?.primarySignature==='string'&&document.primarySignature.length>64],
    ['conservative_signature',typeof document?.conservativeSignature==='string'&&document.conservativeSignature.length>64],
    ['document_module_claim',document?.moduleValidationClaimed===false],
    ['receipt_schema',receipt?.schema==='sqaile.qufense.checkout-authorization.v1'],
    ['decision',receipt?.decision==='ALLOW'],
    ['route',receipt?.source==='qupay'&&receipt?.provider==='stripe'&&receipt?.action==='stripe.checkout.session.create'&&receipt?.purpose==='live_qvit_checkout'],
    ['intent',receipt?.orderRef===expected.orderRef&&receipt?.packId===expected.packId&&receipt?.amount===expected.pack.usdCents&&receipt?.currency==='usd'],
    ['payload_digest',receipt?.payloadDigest===expected.payloadDigest],
    ['provider_boundary',receipt?.externalTransportEncrypted===true&&receipt?.providerAuthentication==='STRIPE_RESTRICTED_LIVE_KEY'],
    ['authorization_profile',receipt?.authorizationProfile==='QF-CHECKOUT-AUTHZ-PQC-1'],
    ['claims',receipt?.providerPayloadPqcClaimed===false&&receipt?.moduleValidationClaimed===false],
    ['timestamps',Number.isFinite(issuedAt)&&Number.isFinite(expiresAt)],
    ['issued_at',issuedAt<=now+1000&&now-issuedAt<=QUFENSE_RECEIPT_LIFETIME_MS+QUFENSE_SIGNATURE_TRANSIT_GRACE_MS],
    ['expiry',expiresAt>now-QUFENSE_SIGNATURE_TRANSIT_GRACE_MS&&expiresAt-issuedAt===QUFENSE_RECEIPT_LIFETIME_MS]
  ];
  return checks.find(([,ok])=>!ok)?.[0]||null;
};
const validQuFenseReceipt=(document,expected,authorityFingerprint,now=Date.now())=>
  qufenseReceiptInvalidReason(document,expected,authorityFingerprint,now)===null;
const authorizeCheckoutWithQuFense=async(intent,env)=>{
  if(!env.QUFENSE||!env.QUFENSE_AUTHORITY_FINGERPRINT){
    return {ok:false,status:503,error:'qufense_checkout_not_configured'};
  }
  const payloadDigest=await sha256Hex(checkoutDigestInput(intent));
  const payload={
    source:'qupay',
    provider:'stripe',
    action:'stripe.checkout.session.create',
    purpose:'live_qvit_checkout',
    orderRef:intent.orderRef,
    packId:intent.packId,
    amount:intent.pack.usdCents,
    currency:'usd',
    payloadDigest,
    externalTransportEncrypted:true,
    providerAuthentication:'STRIPE_RESTRICTED_LIVE_KEY'
  };
  let response;
  try{
    response=await env.QUFENSE.fetch('https://qufense.internal/v1/payments/checkout/authorize',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      // Keep the caller's budget above the QuFense edge-to-origin budget so
      // cold starts can finish and the signed authorization receipt can be
      // validated instead of being canceled mid-flight.
      signal:AbortSignal.timeout(35_000)
    });
  }catch{
    return {ok:false,status:503,error:'qufense_checkout_unavailable'};
  }
  const document=await response.json().catch(()=>null);
  if(!response.ok){
    return {ok:false,status:response.status===403?403:503,error:response.status===403?'qufense_checkout_denied':'qufense_checkout_unavailable',reason:String(document?.reason||document?.error||'QUFENSE_DENIED').slice(0,100)};
  }
  const receiptInvalidReason=qufenseReceiptInvalidReason(document,{...intent,payloadDigest},env.QUFENSE_AUTHORITY_FINGERPRINT);
  if(receiptInvalidReason){
    return {ok:false,status:503,error:'qufense_receipt_invalid',reason:receiptInvalidReason};
  }
  return {ok:true,document,payloadDigest};
};
const verifyStripeSignature=async(raw,header,secret,now=Math.floor(Date.now()/1000))=>{
  if(!secret||!header)return false;
  const entries=String(header).split(',').map(value=>value.trim().split('=',2));
  const timestamp=Number(entries.find(([key])=>key==='t')?.[1]);
  const candidates=entries.filter(([key,value])=>key==='v1'&&/^[0-9a-f]{64}$/i.test(value||'')).map(([,value])=>value.toLowerCase());
  if(!timestamp||!candidates.length||Math.abs(now-timestamp)>300)return false;
  const expected=await hmacHex(secret,`${timestamp}.${raw}`);
  const expectedBytes=encoder.encode(expected);
  return candidates.some(candidate=>timingEqual(expectedBytes,encoder.encode(candidate)));
};
const stripeForm=(body,qufense)=>{
  const form=new URLSearchParams();
  form.set('mode','payment');
  form.set('success_url','https://secquoia.net/aggy-time-ai.html?payment=success&session_id={CHECKOUT_SESSION_ID}');
  form.set('cancel_url','https://secquoia.net/aggy-time-ai.html?payment=cancelled');
  form.set('client_reference_id',body.orderRef);
  form.set('line_items[0][price_data][currency]','usd');
  form.set('line_items[0][price_data][unit_amount]',String(body.pack.usdCents));
  form.set('line_items[0][price_data][product_data][name]',body.pack.label);
  form.set('line_items[0][quantity]','1');
  form.set('invoice_creation[enabled]','true');
  form.set('metadata[schema]','secquoia.qupay.aggy-qvit.v1');
  form.set('metadata[wallet_reference]',body.walletReference);
  form.set('metadata[pack_id]',body.packId);
  form.set('metadata[qvit_amount]',String(body.pack.qvitAmount));
  form.set('metadata[order_ref]',body.orderRef);
  form.set('metadata[quidentify_receipt_id]',body.identity.jti);
  form.set('metadata[quidentify_subject_fingerprint]',body.identity.subjectFingerprint);
  form.set('metadata[qufense_evidence_id]',qufense.receipt.evidenceId);
  form.set('metadata[qufense_authority_fingerprint]',qufense.authorityFingerprint);
  form.set('metadata[qufense_payload_digest]',qufense.receipt.payloadDigest);
  return form;
};
const confirmCheckout=async(request,env)=>{
  if(!env.STRIPE_RESTRICTED_KEY||!env.AGGY_QUPAY_WEBHOOK_SECRET){
    return json({error:'qupay_confirmation_not_configured',failClosed:true},503,request);
  }
  const sessionId=String(new URL(request.url).searchParams.get('session_id')||'');
  if(!/^cs_live_[A-Za-z0-9_]{16,200}$/.test(sessionId)){
    return json({error:'invalid_checkout_session'},422,request);
  }
  let confirmationCapability;
  try{confirmationCapability=await verifyCheckoutConfirmationCapability(request.headers.get('X-QuPay-Confirmation'),env.AGGY_QUPAY_WEBHOOK_SECRET,{sessionId})}catch(error){return json({error:String(error?.message||'invalid_checkout_confirmation_capability'),failClosed:true},401,request)}
  const response=await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`,{
    method:'GET',
    headers:{Authorization:`Bearer ${env.STRIPE_RESTRICTED_KEY}`}
  });
  const object=await response.json().catch(()=>({}));
  if(!response.ok){
    return json({error:'stripe_confirmation_rejected',providerStatus:response.status},502,request);
  }
  try{
    const metadata=object.metadata||{};
    if(confirmationCapability.walletReference!==metadata.wallet_reference||confirmationCapability.identityReceiptId!==metadata.quidentify_receipt_id)throw new Error('checkout_identity_binding_mismatch');
    const walletBinding=await issueWalletBinding(object,env);
    const packId=String(object.metadata?.pack_id||'');
    const pack=PACKS[packId];
    let creditStatus='PENDING_RECONCILIATION';
    try{
      const credit=await creditAggy({id:`stripe-checkout:${object.id}`},object,env);
      creditStatus=credit?.credited===true?'CREDITED':'PENDING_RECONCILIATION';
    }catch(error){
      console.warn(JSON.stringify({event:'aggy_payment_reconciliation_pending',providerSessionId:String(object.id||''),reason:String(error?.message||'unknown').slice(0,80)}));
    }
    return json({
      schema:'secquoia.qupay.aggy-payment-confirmation.v1',
      status:'PAID',
      packId,
      amountUsd:pack.usdCents/100,
      qvitAmount:pack.qvitAmount,
      voiceLiveMinutes:timeAiPackEconomics(pack).voiceLiveMinutes,
      creditStatus,
      voiceReady:creditStatus==='CREDITED',
      walletBinding
    },200,request);
  }catch{
    return json({error:'checkout_not_confirmed',failClosed:true},409,request);
  }
};
const createCheckout=async(request,env)=>{
  if(!env.STRIPE_RESTRICTED_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.AGGY_QUPAY_WEBHOOK_SECRET||!env.QUIDENTIFY_CHECKOUT_RECEIPT_SECRET||!env.QUFENSE||!env.QUFENSE_AUTHORITY_FINGERPRINT){
    return json({error:'qupay_live_not_configured',failClosed:true},503,request);
  }
  let body;
  try{body=await request.json()}catch{return json({error:'invalid_json'},400,request)}
  const packId=String(body.packId||'');
  const pack=PACKS[packId];
  const walletReference=String(body.walletReference||'');
  if(!pack||!validWallet(walletReference)){
    return json({error:'invalid_checkout_request'},422,request);
  }
  let identity;
  try{
    identity=await verifyQuIdentifyCheckoutReceipt(body.identityReceipt||request.headers.get('X-QuIdentify-Receipt'),env.QUIDENTIFY_CHECKOUT_RECEIPT_SECRET,{packId,walletReference});
  }catch(error){
    return json({error:String(error?.message||'quidentify_checkout_denied'),failClosed:true},401,request);
  }
  const orderRef=`qid-${identity.jti}`;
  const intent={packId,pack,walletReference,orderRef,identity};
  const authorization=await authorizeCheckoutWithQuFense(intent,env);
  if(!authorization.ok){
    return json({error:authorization.error,failClosed:true,...(authorization.reason?{reason:authorization.reason}:{})},authorization.status,request);
  }
  const response=await fetch(`${STRIPE_API}/checkout/sessions`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${env.STRIPE_RESTRICTED_KEY}`,
      'Content-Type':'application/x-www-form-urlencoded',
      'Idempotency-Key':`aggy-${orderRef}`.slice(0,100)
    },
    body:stripeForm(intent,authorization.document)
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok){
    return json({error:'stripe_checkout_rejected',providerStatus:response.status,providerCode:String(result?.error?.code||result?.error?.type||'unknown').slice(0,80)},502,request);
  }
  if(!/^https:\/\/checkout\.stripe\.com\//.test(String(result.url||''))){
    return json({error:'invalid_stripe_checkout_url'},502,request);
  }
  const confirmationCapability=await issueCheckoutConfirmationCapability({sessionId:result.id,walletReference,identityReceiptId:identity.jti},env.AGGY_QUPAY_WEBHOOK_SECRET);
  return json({
    schema:'secquoia.qupay.checkout.v1',
    status:'PENDING',
    checkoutUrl:result.url,
    sessionId:result.id,
    confirmationCapability,
    orderRef,
    qufense:{
      authorized:true,
      evidenceId:authorization.document.receipt.evidenceId,
      authorityFingerprint:authorization.document.authorityFingerprint,
      authorizationProfile:authorization.document.receipt.authorizationProfile,
      providerPayloadPqcClaimed:false
    },
    transportBoundary:STRIPE_TRANSPORT_BOUNDARY
  },201,request);
};
const creditAggy=async(event,object,env)=>{
  const metadata=object.metadata||{};
  const pack=PACKS[String(metadata.pack_id||'')];
  const walletReference=String(metadata.wallet_reference||'');
  const declaredQVit=Number(metadata.qvit_amount);
  if(metadata.schema!=='secquoia.qupay.aggy-qvit.v1'||!pack||!validWallet(walletReference)||declaredQVit!==pack.qvitAmount){
    throw new Error('invalid_aggy_credit_metadata');
  }
  if(Number(object.amount_total)!==pack.usdCents||String(object.currency||'').toLowerCase()!=='usd'){
    throw new Error('aggy_credit_amount_mismatch');
  }
  const payload=JSON.stringify({
    schema:'secquoia.qupay.aggy-qvit-credit.v1',
    eventId:`stripe-checkout:${String(object.id||'')}`,
    paymentStatus:'CONFIRMED',
    walletReference,
    qvitAmount:pack.qvitAmount,
    amountUsd:pack.usdCents/100,
    voiceLiveMinutes:timeAiPackEconomics(pack).voiceLiveMinutes,
    provider:'stripe',
    providerSessionId:String(object.id||''),
    packId:String(metadata.pack_id),
    orderRef:String(metadata.order_ref||'').slice(0,100)
  });
  const timestamp=Math.floor(Date.now()/1000);
  const signature=await hmacHex(env.AGGY_QUPAY_WEBHOOK_SECRET,`${timestamp}.${payload}`);
  const response=await fetch(AGGY_CREDIT_ENDPOINT,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-QuPay-Signature':`t=${timestamp},v1=${signature}`},
    body:payload
  });
  if(!response.ok)throw new Error(`aggy_credit_failed_${response.status}`);
  return response.json();
};
const stripeWebhook=async(request,env)=>{
  if(!env.STRIPE_WEBHOOK_SECRET||!env.AGGY_QUPAY_WEBHOOK_SECRET){
    return json({error:'qupay_webhook_not_configured',failClosed:true},503,request);
  }
  const raw=await request.text();
  if(!await verifyStripeSignature(raw,request.headers.get('Stripe-Signature'),env.STRIPE_WEBHOOK_SECRET)){
    return json({error:'invalid_stripe_signature'},401,request);
  }
  let event;
  try{event=JSON.parse(raw)}catch{return json({error:'invalid_json'},400,request)}
  if(event.livemode!==true)return json({error:'stripe_live_event_required'},422,request);
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
    return json({received:true,action:'IGNORED_EVENT_TYPE'},200,request);
  }
  const object=event.data?.object||{};
  if(object.payment_status!=='paid')return json({received:true,action:'AWAITING_PAYMENT'},200,request);
  try{
    const credit=await creditAggy(event,object,env);
    return json({received:true,action:'AGGY_QVIT_CREDITED',duplicate:Boolean(credit.duplicate)},200,request);
  }catch(error){
    return json({error:'aggy_credit_delivery_failed',reason:String(error.message||'unknown').slice(0,100)},502,request);
  }
};

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='OPTIONS'){
      if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
      return new Response(null,{status:204,headers:cors(request)});
    }
    if(url.pathname==='/v1/qupay/health'&&request.method==='GET'){
      let qufenseRuntimeReady=false;
      if(env.QUFENSE){
        try{
          const response=await env.QUFENSE.fetch('https://qufense.internal/readyz',{
            method:'GET',
            signal:AbortSignal.timeout(4000)
          });
          const document=await response.json().catch(()=>null);
          qufenseRuntimeReady=Boolean(
            response.ok&&
            document?.ready===true&&
            document?.productionReady===true&&
            document?.flowReceiptAuthority?.fingerprint===env.QUFENSE_AUTHORITY_FINGERPRINT
          );
        }catch{}
      }
      const checks={
        stripeRestrictedKey:Boolean(env.STRIPE_RESTRICTED_KEY),
        stripeWebhookSecret:Boolean(env.STRIPE_WEBHOOK_SECRET),
        aggySharedSecret:Boolean(env.AGGY_QUPAY_WEBHOOK_SECRET),
        quidentifyCheckoutReceiptVerifier:Boolean(env.QUIDENTIFY_CHECKOUT_RECEIPT_SECRET),
        qufenseServiceBinding:Boolean(env.QUFENSE),
        qufenseRuntimeReady,
        qufenseAuthorityFingerprint:/^[a-f0-9]{32}$/.test(String(env.QUFENSE_AUTHORITY_FINGERPRINT||''))
      };
      const ready=Object.values(checks).every(Boolean);
      return json({
        service:'QuPay Aggy Checkout',
        version:RELEASE,
        environment:'LIVE',
        ready,
        checks,
        checkout:'/v1/qupay/checkout',
        webhook:'/v1/qupay/webhooks/stripe',
        validationPackEnabled:false,
        cardDataStored:false,
        overdraftAllowed:false,
        qufenseCheckoutAuthorizationRequired:true,
        transportBoundary:STRIPE_TRANSPORT_BOUNDARY
      },ready?200:503,request);
    }
    if(url.pathname==='/v1/qupay/checkout'&&request.method==='POST')return createCheckout(request,env);
    if(url.pathname==='/v1/qupay/checkout/confirm'&&request.method==='GET')return confirmCheckout(request,env);
    if(url.pathname==='/v1/qupay/webhooks/stripe'&&request.method==='POST')return stripeWebhook(request,env);
    return json({error:'not_found'},404,request);
  }
};

export {PACKS,STRIPE_TRANSPORT_BOUNDARY,TIME_AI_QVIT_PER_MINUTE,authorizeCheckoutWithQuFense,checkoutDigestInput,confirmCheckout,hmacHex,issueCheckoutConfirmationCapability,issueWalletBinding,qufenseReceiptInvalidReason,stripeForm,timeAiPackEconomics,validQuFenseReceipt,verifyCheckoutConfirmationCapability,verifyQuIdentifyCheckoutReceipt,verifyStripeSignature};
