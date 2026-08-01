import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [page,embed,voice,market]=await Promise.all([
  '../aggy-time-ai.html',
  '../aggy-embed.js',
  '../aggy-realtime-voice.js',
  '../qu-market.html'
].map(path=>readFile(new URL(path,import.meta.url),'utf8')));

const script=page.match(/<script>([\s\S]+)<\/script>/)?.[1]||'';

test('dedicated Time AI page is syntactically valid and deliberately excludes the Marketplace',()=>{
  new Function(script);
  assert.match(page,/Una ruta directa, segura y sin carrito/);
  assert.match(page,/Paquete<\/span>/);
  assert.match(page,/Identidad<\/span>/);
  assert.match(page,/Pago<\/span>/);
  assert.match(page,/Voice LIVE<\/span>/);
  assert.doesNotMatch(page,/id="ai-services"|Ciberseguridad modular|Canasta|Carrito/);
});

test('direct flow allowlists packages and trusted return origins',()=>{
  for(const pack of ['qvit-ai-credit-1','qvit-ai-credit-5','qvit-ai-credit-10','qvit-ai-credit-25','qvit-ai-credit-100','qvit-ai-credit-500']){
    assert.match(script,new RegExp(`'${pack}'`));
  }
  for(const origin of ['https://secquoia.group','https://secquoia.net','https://qnq.ooo']){
    assert.match(script,new RegExp(origin.replaceAll('.','\\.')));
  }
  assert.match(script,/url\.protocol==='https:'&&TRUSTED_RETURN_ORIGINS\.has\(url\.origin\)/);
});

test('direct flow runs package, QuIdentify, QuPay Stripe and certified Aggy continuation in order',()=>{
  assert.match(script,/resolveWallet\(params\.get\('wallet_ref'\)\)/);
  assert.match(script,/https:\/\/quidentify\.secquoia\.group\/v1\/authorize/);
  assert.match(script,/url\.searchParams\.set\('purpose','time_ai_checkout'\)/);
  assert.match(script,/quidentify_receipt/);
  assert.match(script,/X-QuIdentify-Receipt/);
  assert.doesNotMatch(script,/searchParams\.set\('quidentify','verified'\)/);
  assert.match(script,/https:\/\/pay\.secquoia\.group\/v1\/qupay\/checkout/);
  assert.match(script,/\^https:\\\/\\\/checkout\\\.stripe\\\.com\\\//);
  assert.match(script,/\/v1\/qupay\/checkout\/confirm\?session_id=/);
  assert.match(script,/X-QuPay-Confirmation/);
  assert.match(script,/confirmationCapability/);
  assert.match(script,/response\.status===401[\s\S]{0,220}delete pending\.identityReceipt[\s\S]{0,220}identityUrl\(pending\)/);
  assert.match(script,/location\.assign\(identityUrl\(pending\)\)/);
  assert.doesNotMatch(script,/setTimeout\(\(\)=>location\.assign\(identityUrl\(pending\)\)/);
  assert.match(script,/Continuar con QuIdentify/);
  assert.match(script,/body\.status!=='PAID'/);
  assert.match(script,/localStorage\.setItem\(WALLET_KEY,body\.walletBinding\)/);
  assert.match(script,/localStorage\.setItem\(PAYMENT_KEY,JSON\.stringify\(confirmation\)\)/);
  assert.match(script,/destination\.hash=new URLSearchParams\(\{aggy_payment:'success',session_id:sessionId\}\)\.toString\(\)/);
});

test('package selection bypasses Marketplace from both ecosystem and SECQUOIA.net launchers',()=>{
  assert.match(embed,/timeAiCheckoutUrlFor/);
  assert.match(embed,/aggy-time-ai\.html/);
  assert.doesNotMatch(embed,/const marketplaceUrlFor=/);
  assert.match(market,/function timeAiUrl\(packId\)\{const url=new URL\('https:\/\/secquoia\.net\/aggy-time-ai\.html'\)/);
});

test('post-payment confirmation crosses the Stripe return and is consumed once by Voice LIVE',()=>{
  assert.match(voice,/paymentThankYouFallbackKey='secquoia\.aggy\.payment-thank-you\.pending\.v1'/);
  assert.match(voice,/localStorage\.getItem\(paymentThankYouFallbackKey\)/);
  assert.match(voice,/localStorage\.removeItem\(paymentThankYouFallbackKey\)/);
  assert.match(voice,/params\.get\('aggy_payment'\)/);
  assert.match(voice,/paymentFragment\.get\('aggy_payment'\)/);
  assert.match(voice,/params\.delete\('aggy_payment'\)/);
  assert.match(voice,/\(await paymentReturnPromise\)\|\|postPaymentGreeting/);
  assert.match(voice,/attempt<40/);
  assert.match(script,/Continuar con Aggy/);
  assert.match(script,/setTimeout\(\(\)=>location\.replace\(destination\.href\),900\)/);
  assert.match(voice,/server-confirmed post-payment continuation/);
  assert.match(voice,/exact confirmed amount/);
  assert.match(voice,/exact purchased Voice LIVE allowance/);
  assert.match(voice,/paymentFragment=new URLSearchParams\(location\.hash\.replace/);
  assert.match(voice,/params\.get\('session_id'\)\|\|paymentFragment\.get\('session_id'\)/);
  assert.match(embed,/url\.hash=new URLSearchParams\(\{payment:'success',session_id:paymentReturn\}\)\.toString\(\)/);
  assert.match(embed,/history\.replaceState\(history\.state,'',sanitized\.href\)/);
});

test('the direct flow never charges automatically',()=>{
  assert.match(page,/No se realiza ningún cargo hasta que tú lo confirmas/);
  assert.match(script,/method:'POST'/);
  assert.doesNotMatch(script,/payment_method|confirm=true|auto.?charge/i);
});
