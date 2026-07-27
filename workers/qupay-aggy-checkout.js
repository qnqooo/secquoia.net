const RELEASE='1.0.0-rc.1';
const STRIPE_API='https://api.stripe.com/v1';
const AGGY_CREDIT_ENDPOINT='https://aggy.secquoia.group/api/aggy/usage/qupay-credit';
const ALLOWED_ORIGINS=new Set(['https://secquoia.net','https://www.secquoia.net']);
const PACKS=Object.freeze({
  'qvit-ai-credit-25':Object.freeze({usdCents:2500,qvitAmount:25_000_000,label:'QVit AI resource credit · $25'}),
  'qvit-ai-credit-100':Object.freeze({usdCents:10_000,qvitAmount:100_000_000,label:'QVit AI resource credit · $100'}),
  'qvit-ai-credit-500':Object.freeze({usdCents:50_000,qvitAmount:500_000_000,label:'QVit AI resource credit · $500'})
});
const encoder=new TextEncoder();
const cors=request=>{
  const origin=request.headers.get('Origin');
  return ALLOWED_ORIGINS.has(origin)?{
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Idempotency-Key',
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
const stripeForm=body=>{
  const form=new URLSearchParams();
  form.set('mode','payment');
  form.set('success_url','https://secquoia.net/qu-market.html?payment=success#ai-services');
  form.set('cancel_url','https://secquoia.net/qu-market.html?payment=cancelled#ai-services');
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
  return form;
};
const createCheckout=async(request,env)=>{
  if(!env.STRIPE_RESTRICTED_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.AGGY_QUPAY_WEBHOOK_SECRET){
    return json({error:'qupay_live_not_configured',failClosed:true},503,request);
  }
  let body;
  try{body=await request.json()}catch{return json({error:'invalid_json'},400,request)}
  const packId=String(body.packId||'');
  const pack=PACKS[packId];
  const walletReference=String(body.walletReference||'');
  const orderRef=String(body.orderRef||'');
  if(!pack||!validWallet(walletReference)||!validOrder(orderRef)){
    return json({error:'invalid_checkout_request'},422,request);
  }
  const response=await fetch(`${STRIPE_API}/checkout/sessions`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${env.STRIPE_RESTRICTED_KEY}`,
      'Content-Type':'application/x-www-form-urlencoded',
      'Idempotency-Key':`aggy-${orderRef}`.slice(0,100)
    },
    body:stripeForm({packId,pack,walletReference,orderRef})
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok){
    return json({error:'stripe_checkout_rejected',providerStatus:response.status,providerCode:String(result?.error?.code||result?.error?.type||'unknown').slice(0,80)},502,request);
  }
  if(!/^https:\/\/checkout\.stripe\.com\//.test(String(result.url||''))){
    return json({error:'invalid_stripe_checkout_url'},502,request);
  }
  return json({schema:'secquoia.qupay.checkout.v1',status:'PENDING',checkoutUrl:result.url,sessionId:result.id,orderRef},201,request);
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
    eventId:String(event.id),
    paymentStatus:'CONFIRMED',
    walletReference,
    qvitAmount:pack.qvitAmount,
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
      const checks={
        stripeRestrictedKey:Boolean(env.STRIPE_RESTRICTED_KEY),
        stripeWebhookSecret:Boolean(env.STRIPE_WEBHOOK_SECRET),
        aggySharedSecret:Boolean(env.AGGY_QUPAY_WEBHOOK_SECRET)
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
        cardDataStored:false,
        overdraftAllowed:false
      },ready?200:503,request);
    }
    if(url.pathname==='/v1/qupay/checkout'&&request.method==='POST')return createCheckout(request,env);
    if(url.pathname==='/v1/qupay/webhooks/stripe'&&request.method==='POST')return stripeWebhook(request,env);
    return json({error:'not_found'},404,request);
  }
};

export {PACKS,hmacHex,stripeForm,verifyStripeSignature};
