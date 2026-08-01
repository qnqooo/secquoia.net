import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');
const css=await readFile(new URL('../aggy-marketplace.css',import.meta.url),'utf8');
const voice=await readFile(new URL('../aggy-realtime-voice.js',import.meta.url),'utf8');
const embed=await readFile(new URL('../aggy-embed.js',import.meta.url),'utf8');
const addons=await readFile(new URL('../qumarket-addons.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../workers/aggy-realtime-session.js',import.meta.url),'utf8');
const release=JSON.parse(await readFile(new URL('../aggy-release.json',import.meta.url),'utf8'));
const workerModule=await import(`data:text/javascript;base64,${Buffer.from(worker).toString('base64')}`);
const header=html.match(/<header class="top">([\s\S]*?)<\/header>/)?.[1]||'';
const leaseId='11111111-1111-4111-8111-111111111111';
const leaseCapability='a'.repeat(43);
const fakeUsageMeters=()=>({
  idFromName:name=>name,
  get:()=>({
    fetch:async request=>{
      const path=new URL(request.url).pathname;
      if(path==='/activate')return new Response(JSON.stringify({authorized:true,expiresAt:'2026-07-27T05:00:00.000Z'}),{headers:{'Content-Type':'application/json'}});
      if(path==='/bind')return new Response(JSON.stringify({bound:true,expiresAt:'2026-07-27T05:00:00.000Z'}),{headers:{'Content-Type':'application/json'}});
      if(path==='/cancel')return new Response(JSON.stringify({cancelled:true}),{headers:{'Content-Type':'application/json'}});
      if(path==='/status')return new Response(JSON.stringify({free:{remainingSeconds:600},wallet:{balance:0,topUpAvailable:false},continuation:{customerQVit:200000}}),{headers:{'Content-Type':'application/json'}});
      return new Response(JSON.stringify({error:'unexpected_meter_path'}),{status:404,headers:{'Content-Type':'application/json'}});
    }
  })
});

test('Marketplace header keeps only the requested direct controls',()=>{
  assert.match(header,/id="headerSupport"[^>]*>QuSupport · Aggy/);
  assert.match(header,/href="qupkiaas-deploy\.html">QuDeploy/);
  assert.match(header,/class="btn cart-pill"/);
  assert.match(header,/id="headerCartCount"/);
  assert.doesNotMatch(header,/>SECQUOIA\.NET<\/a>/);
  assert.doesNotMatch(header,/>Products<\/a>|>Productos<\/a>|>QuCFA<\/a>/);
  assert.match(header,/class="runtime-settings" aria-hidden="true"/);
});

test('Marketplace uses a compact four-column catalog and limits premium width',()=>{
  assert.match(html,/\.cards\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html,/\.product\.featured\{grid-column:span 2;min-height:308px\}/);
  assert.match(html,/\.product\{min-height:308px;padding:18px/);
  assert.ok(html.includes('data-talk="\'+p.id+\'"'));
  assert.match(html,/>Aggy<\/button>/);
});

test('Aggy Realtime client follows a backend-mediated WebRTC flow',()=>{
  new Function(voice);
  assert.match(voice,/const realtimeModel='gpt-realtime-2\.1'/);
  assert.match(voice,/const sessionEndpoint='https:\/\/aggy\.secquoia\.group\/api\/aggy\/realtime\/session'/);
  assert.match(voice,/const healthEndpoint='https:\/\/aggy\.secquoia\.group\/api\/aggy\/realtime\/health'/);
  assert.match(voice,/prewarmVoice\(\)/);
  assert.match(voice,/setState\('connecting','Aggy está iniciando'/);
  assert.match(voice,/await startRealtime\(false,\{userInitiated:permissionState!=='granted'\}\)/);
  assert.match(voice,/navigator\.permissions\?\.query/);
  assert.match(voice,/permissionState!=='denied'/);
  assert.match(voice,/startRealtime\(false,\{userInitiated:true\}\)/);
  assert.match(voice,/microphone_permission_timeout/);
  assert.match(voice,/WEBRTC_OPEN_TIMEOUT/);
  assert.match(voice,/connectionOpenTimeout=setTimeout/);
  assert.match(voice,/type:'response\.create'/);
  assert.match(voice,/sendInitialGreeting\(\)/);
  assert.match(voice,/greetingSent/);
  assert.match(voice,/QuGEO selected \$\{language\}/);
  assert.match(voice,/Start speaking immediately/);
  assert.match(voice,/Keep it compact, with no introductory filler or long pause/);
  assert.match(voice,/It's a pleasure to meet you\. How can I help you\?/);
  assert.match(voice,/new RTCPeerConnection\(\)/);
  assert.match(voice,/Content-Type':'application\/sdp'/);
  assert.match(voice,/credentials:'omit'/);
  assert.match(voice,/X-Aggy-Visitor-ID/);
  assert.match(voice,/X-Aggy-Wallet-Binding/);
  assert.match(voice,/\/v1\/qupay\/checkout\/confirm\?session_id=/);
  assert.match(voice,/secquoia\.aggy\.qupay\.wallet-binding\.v1/);
  assert.match(voice,/¡Pago confirmado! Muchas gracias por continuar conmigo/);
  assert.match(voice,/voiceLiveMinutes/);
  assert.match(voice,/\$\{paidMinutes\} minutos adicionales de conversación Voice LIVE/);
  assert.match(voice,/single most important objective, blocker or decision/);
  assert.match(voice,/secquoia:aggy:payment-confirmed/);
  assert.match(voice,/publishPaymentConfirmation\(paidConfirmation\)/);
  assert.match(voice,/startRealtime\(true,\{userInitiated:permissionState!=='granted',postPayment:paidConfirmation\}\)/);
  assert.match(voice,/turn_detection:\{type:'semantic_vad',eagerness:'high',create_response:true,interrupt_response:true\}/);
  assert.match(voice,/const speechSpeed=1\.08/);
  assert.match(voice,/output:\{voice:naturalVoice,speed:speechSpeed\}/);
  assert.match(voice,/Keep the conversation dynamic/);
  assert.match(voice,/keep pauses between ideas and sentences brief/);
  assert.match(voice,/contentHint='speech'/);
  assert.doesNotMatch(voice,/X-Aggy-Voice-Model/);
  assert.doesNotMatch(voice,/startLocalFallback|localFallback|speechSynthesis|SpeechSynthesisUtterance|SpeechRecognition|MediaRecorder/);
  assert.match(voice,/window\.AggyVoice=Object\.freeze/);
  assert.match(voice,/readAloud:text/);
  assert.match(voice,/const naturalVoice='marin'/);
  assert.match(voice,/let qugeoLanguage='es'/);
  assert.match(voice,/let qugeoLocale='es-CO'/);
  assert.match(voice,/consistently feminine vocal presentation/);
  assert.match(voice,/internationally neutral accent/);
  assert.match(voice,/AUTHORIZED_SECQUOIA_WEBSITES_DATA_ONLY|Authorized SECQUOIA website reference data/);
  assert.match(voice,/Never require, force, delay, or block an answer because a source URL is not cited/);
  assert.match(voice,/Do not speak raw URLs by default/);
  assert.doesNotMatch(voice,/sk-(?:proj-)?[A-Za-z0-9_-]{8,}|OPENAI_API_KEY|api\.openai\.com/);
});

test('Post-payment journey is visual, exact and action-oriented without forcing the panel open',()=>{
  assert.match(html,/id="aggyPaymentMoment"/);
  assert.match(html,/Tu conversación continúa\./);
  assert.match(html,/id="aggyPaymentAmount"/);
  assert.match(html,/id="aggyPaymentMinutes"/);
  assert.match(html,/id="aggyPaymentContinue"/);
  assert.match(html,/class="aggy-payment-route"/);
  assert.match(html,/secquoia:aggy:payment-confirmed/);
  assert.match(html,/showAggyPaymentMoment[\s\S]{0,1500}setAssistantState\('minimized',\{focus:false\}\)/);
  assert.match(html,/showAggyPaymentMoment[\s\S]{0,1700}openAggyVoice\(\{focus:false,reveal:false\}\)/);
  assert.match(html,/assistantLauncher\.dataset\.paidAvailable==='true'\)\{openAggyVoice\(\{reveal:true\}\);return\}/);
  assert.match(html,/assistantLauncher\.dataset\.continuityRequired=String\(expired\)/);
  assert.match(html,/const continuityRequired=assistantLauncher\.dataset\.continuityRequired==='true'/);
  assert.match(html,/continuityRequired\)\{openAggyContinuity\(\);return\}/);
  assert.match(html,/assistantLauncher\.dataset\.paidMinutes=String\(minutes\)/);
  assert.match(html,/aggyPaymentContinue\.onclick=\(\)=>\{aggyPaymentContinue\.hidden=true;[\s\S]{0,180}openAggyVoice\(\{focus:false,reveal:false\}\)\}/);
  assert.match(html,/state==='blocked'&&paidAvailable[\s\S]{0,220}aggyPaymentContinue\.hidden=false/);
  assert.match(html,/document\.body\.classList\.contains\('aggy-embed-mode'\)\)return/);
});

test('Visitor trials are isolated per browser instead of being shared by public IP',async()=>{
  const commonHeaders={
    'CF-Connecting-IP':'203.0.113.10',
    'User-Agent':'Secquoia Test Browser',
    'Accept-Language':'es-CO'
  };
  const first=await workerModule.usageSubject(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
    headers:{...commonHeaders,'X-Aggy-Visitor-ID':`v2_${'a'.repeat(43)}`}
  }));
  const second=await workerModule.usageSubject(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
    headers:{...commonHeaders,'X-Aggy-Visitor-ID':`v2_${'b'.repeat(43)}`}
  }));
  assert.notEqual(first,second);
  assert.equal(first.length,43);
  assert.equal(second.length,43);
  assert.match(worker,/X-Aggy-Visitor-ID/);
});

test('Aggy backend keeps the current model and standard API key server-side',()=>{
  assert.match(worker,/DEFAULT_REALTIME_MODEL='gpt-realtime-2\.1'/);
  assert.match(worker,/DEFAULT_REALTIME_VOICE='marin'/);
  assert.match(worker,/voice:DEFAULT_REALTIME_VOICE/);
  assert.match(worker,/voiceIdentity:'feminine'/);
  assert.match(worker,/defaultLocale:'es-CO'/);
  assert.doesNotMatch(worker,/OPENAI_REALTIME_VOICE/);
  assert.match(worker,/https:\/\/api\.openai\.com\/v1\/realtime\/calls/);
  assert.match(worker,/env\.OPENAI_API_KEY/);
  assert.match(worker,/Content-Disposition: form-data; name="sdp"/);
  assert.match(worker,/Content-Disposition: form-data; name="session"/);
  assert.match(worker,/'Content-Type':`multipart\/form-data; boundary=\$\{boundary\}`/);
  assert.match(worker,/model=env\.OPENAI_REALTIME_MODEL\|\|DEFAULT_REALTIME_MODEL/);
  assert.doesNotMatch(worker,/sk-(?:proj-)?[A-Za-z0-9_-]{8,}/);
  assert.match(worker,/https:\/\/secquoia\.net/);
  assert.match(worker,/Access-Control-Allow-Origin/);
  assert.match(worker,/'Access-Control-Expose-Headers':'X-Aggy-Lease-Expires-At'/);
});

test('Aggy backend validates SDP and builds the trusted Realtime session',async()=>{
  const endpoint='https://qu-market.secquoia.group/api/aggy/realtime/session';
  const noKey=await workerModule.default.fetch(new Request(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/sdp'},
    body:'v=0\r\n'
  }),{});
  assert.equal(noKey.status,503);

  const originalFetch=globalThis.fetch;
  let upstreamRequest;
  globalThis.fetch=async(url,init)=>{
    upstreamRequest={url,init};
    return new Response('v=0\r\no=openai 1 1 IN IP4 127.0.0.1\r\n',{status:200});
  };
  try{
    const response=await workerModule.default.fetch(new Request(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/sdp','X-Aggy-Lease':leaseId,'X-Aggy-Lease-Capability':leaseCapability},
      body:'v=0\r\no=aggy 1 1 IN IP4 127.0.0.1\r\n'
    }),{OPENAI_API_KEY:'test-only-key',OPENAI_REALTIME_VOICE:'echo',AGGY_USAGE_METERS:fakeUsageMeters()});
    assert.equal(response.status,200);
    assert.equal(upstreamRequest.url,'https://api.openai.com/v1/realtime/calls');
    assert.equal(upstreamRequest.init.headers.Authorization,'Bearer test-only-key');
    assert.match(upstreamRequest.init.headers['Content-Type'],/^multipart\/form-data; boundary=----aggy-[0-9a-f-]{36}$/);
    assert.match(upstreamRequest.init.headers['OpenAI-Safety-Identifier'],/^[A-Za-z0-9_-]{43}$/);
    assert.match(upstreamRequest.init.body,/Content-Disposition: form-data; name="sdp"\r\n\r\nv=0\r\no=aggy 1 1 IN IP4 127\.0\.0\.1\r\n/);
    assert.match(upstreamRequest.init.body,/Content-Disposition: form-data; name="session"\r\n\r\n\{"type":"realtime","model":"gpt-realtime-2\.1","audio":\{"output":\{"voice":"marin"\}\}\}\r\n/);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Aggy backend returns only a bounded provider error code',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({
    error:{type:'invalid_request_error',code:'invalid_sdp',message:'provider detail'}
  }),{status:400});
  try{
    const response=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/realtime/session',{
      method:'POST',
      headers:{'Content-Type':'application/sdp','X-Aggy-Lease':leaseId,'X-Aggy-Lease-Capability':leaseCapability},
      body:'v=0\r\no=aggy 1 1 IN IP4 127.0.0.1\r\n'
    }),{OPENAI_API_KEY:'test-only-key',AGGY_USAGE_METERS:fakeUsageMeters()});
    assert.equal(response.status,502);
    const body=await response.json();
    assert.equal(body.providerStatus,400);
    assert.equal(body.providerCode,'invalid_sdp');
    assert.equal('message' in body,false);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Aggy publishes one consistent candidate version with promotion blocked',async()=>{
  assert.match(release.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/);
  assert.equal(release.version,'1.3.0-rc.1');
  assert.equal(release.channel,'release-candidate');
  assert.equal(release.lifecycle,'release-candidate');
  assert.equal(release.productionApproved,false);
  assert.equal(release.thirdPartySale,false);
  assert.ok(release.gaScope.includes('AGGY_VOICE_LIVE'));
  assert.ok(release.previewCapabilities.includes('CDR_PROTECTED_ATTACHMENTS'));
  assert.match(voice,new RegExp(`const aggyVersion='${release.version.replaceAll('.','\\.')}';`));
  assert.equal(workerModule.AGGY_RELEASE.version,release.version);
  assert.match(html,new RegExp(`Aggy v${release.version.replaceAll('.','\\.')}`));

  const response=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/version'));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.version,release.version);
  assert.equal(body.channel,release.channel);
  assert.equal(body.productionApproved,false);
  assert.equal(body.thirdPartySale,false);
  assert.deepEqual(body.gaScope,release.gaScope);
  assert.deepEqual(body.previewCapabilities,release.previewCapabilities);
});

test('Aggy Voice health probe activates without opening a paid provider session',async()=>{
  const originalFetch=globalThis.fetch;
  let called=false;
  globalThis.fetch=async()=>{called=true;return new Response('unexpected')};
  try{
    const response=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/realtime/health',{
      headers:{Origin:'https://secquoia.net','Accept-Language':'es-CO,es;q=0.9,en;q=0.8'}
    }),{OPENAI_API_KEY:'test-only-key',OPENAI_REALTIME_VOICE:'echo',AGGY_USAGE_METERS:fakeUsageMeters()});
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.status,'ready');
    assert.equal(body.providerCallExecuted,false);
    assert.equal(body.microphonePermissionRequired,true);
    assert.equal(body.voice,'marin');
    assert.equal(body.voiceIdentity,'feminine');
    assert.equal(body.defaultLocale,'es-CO');
    assert.equal(body.release.version,release.version);
    assert.equal(body.release.channel,'release-candidate');
    assert.equal(body.release.productionApproved,false);
    assert.equal(body.release.thirdPartySale,false);
    assert.equal(body.qugeo.language,'es');
    assert.equal(body.qugeo.locale,'es-CO');
    assert.equal(body.qugeo.source,'BROWSER_LANGUAGE_FALLBACK');
    assert.equal(body.qugeo.ipStored,false);
    assert.equal(called,false);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Aggy Voice UI exposes live, mute and end controls with honest state',()=>{
  for(const id of ['aggyLiveVoice','aggyVoiceMute','aggyVoiceEnd','aggyVoiceBadge','aggyVoiceStage']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/servicio WebRTC se prepara al abrir el Marketplace/);
  assert.match(html,/micrófono requiere permiso explícito/);
  assert.match(css,/\.aggy-voice-stage/);
  assert.match(css,/\.aggy-orb/);
  assert.match(voice,/for\(const timeoutMs of \[6000,8000\]\)/);
  assert.match(voice,/fetchVoiceHealth\(\)/);
  assert.match(voice,/new AbortController\(\)/);
  assert.doesNotMatch(voice,/AbortSignal\.timeout/);
});

test('Marketplace keeps chat compact while Voice LIVE starts without stealing focus',()=>{
  assert.match(html,/setAssistantState\(embedded\?'expanded':'hidden',\{persist:false,focus:false\}\)/);
  assert.match(html,/\.assistant\.hidden~\.assistant-launcher\{opacity:1;visibility:visible;pointer-events:auto;transform:none\}/);
  assert.doesNotMatch(html,/\.assistant\.hidden\+\.assistant-launcher/);
  assert.ok(
    html.indexOf('<aside class="aggy-payment-moment"') < html.indexOf('<button class="assistant-launcher"'),
    'the compact launcher must remain visible when the payment moment is mounted before it'
  );
  assert.match(html,/window\.addEventListener\('load',\(\)=>openAggyVoice\(\{focus:false,reveal:false\}\)/);
  assert.match(html,/assistantLauncher\.onclick=\(\)=>\{assistantLauncher\.dataset\.guideDismissed='true';const continuityRequired=/);
  assert.match(html,/secquoia:aggy:start-voice/);
  assert.match(html,/openAggyVoice\(\{focus:false,reveal:false\}\)/);
  assert.match(html,/secquoia:aggy:voice-state/);
  assert.match(html,/trustedParents/);
  assert.match(html,/data-open-aggy-panel="voice"/);
  assert.match(html,/document\.getElementById\('aggyLiveVoice'\)\?\.click\(\)/);
  assert.doesNotMatch(html,/data-market-aggy-tab="voice"/);
  assert.match(html,/EN VIVO · 10 min gratis/);
  assert.match(html,/aggy-market-live-halo/);
  assert.match(html,/aggy-guide-pulse/);
  assert.match(html,/Toca aquí: chat, archivos y llamadas seguras/);
  assert.match(html,/class="assistant-minute-chain" role="meter"/);
  assert.equal((html.match(/<i class="assistant-minute-link"><\/i>/g)||[]).length,10);
  assert.match(html,/secquoia:aggy:usage-state/);
  assert.match(html,/updateAggyMinuteChain/);
});

test('Embedded Aggy exposes no nested launcher and keeps advanced invitation in the grid',()=>{
  assert.match(css,/body\.aggy-embed-mode \.assistant-launcher,body\.aggy-embed-mode #assistantLauncher\{display:none!important/);
  assert.match(html,/if\(embedded\)\{document\.body\.classList\.add\('aggy-embed-mode'\);assistantLauncher\.hidden=true/);
  assert.match(html,/class="aggy-drawer aggy-chat-invite-drawer"/);
  assert.match(css,/\.aggy-chat-invite-drawer\{display:none\}/);
  assert.match(html,/data-aggy-quick="chat"><span>＋<\/span><strong>Nuevo chat<\/strong>/);
});

test('QuPay exits the embedded chat before navigating to Stripe Checkout',()=>{
  assert.match(html,/setAssistantState\('hidden',\{persist:false,focus:false\}\)/);
  assert.match(html,/secquoia:aggy:qupay-checkout/);
  assert.match(html,/window\.parent\.postMessage\(\{type:'secquoia:aggy:qupay-checkout',checkoutUrl:result\.checkoutUrl\}/);
  assert.match(html,/window\.location\.assign\(result\.checkoutUrl\)/);
});

test('QuPay status is non-invasive, deduplicated and sends one checkout request',()=>{
  assert.match(html,/function agentSay\(text,reveal=true,messageKey=''\)/);
  assert.match(html,/if\(reveal\)openAgent\(\)/);
  assert.match(html,/data-message-key/);
  assert.match(html,/false,'qupay-checkout'/);
  assert.match(html,/async function requestTimeAiCheckout/);
  assert.match(html,/'Idempotency-Key':orderRef/);
  assert.doesNotMatch(html,/for\(let attempt=0;attempt<2;attempt\+\+\)/);
  assert.doesNotMatch(html,/setTimeout\(resolve,450\)/);
});

test('QuCFA prices one prepaid Aggy Minute without overdraft',()=>{
  const quote=workerModule.aggyBlockQuote();
  assert.equal(quote.durationSeconds,60);
  assert.equal(quote.customerQVit,200_000);
  assert.equal(quote.providerReserveUsd,.125);
  assert.equal(quote.targetMarginBps,3500);
  assert.equal(quote.overdraftAllowed,false);
  assert.equal(quote.unit,'AGGY_MINUTE');
  assert.equal(quote.optimizer.name,'QuOptio');
  assert.equal(quote.rateCard.model,'gpt-realtime-2.1');
  assert.equal(quote.rateCard.version,'2026-07-26');
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.silentModelDowngradeAllowed,false);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.staleRateCardAction,'FAIL_CLOSED');
  assert.equal(workerModule.rateCardIsCurrent(Date.parse('2026-08-24T00:00:00.000Z')),true);
  assert.equal(workerModule.rateCardIsCurrent(Date.parse('2026-08-26T00:00:01.000Z')),false);
});

test('QuCFA reconciles multimodal response.done usage against the versioned rate card',()=>{
  const quote=workerModule.quoteRealtimeUsage({
    input_token_details:{
      text_tokens:100,
      audio_tokens:50,
      cached_tokens:20,
      cached_tokens_details:{text_tokens:20,audio_tokens:0,image_tokens:0}
    },
    output_token_details:{text_tokens:30,audio_tokens:40}
  });
  assert.equal(quote.status,'RECONCILED_USAGE');
  assert.equal(quote.rateCard.sourceRef,'https://developers.openai.com/api/docs/models/gpt-realtime-2.1');
  assert.ok(quote.providerCostQcu>0);
  assert.ok(quote.customerQVit>quote.providerCostQcu);
});

test('Realtime provider access fails closed without an atomic usage lease',async()=>{
  let called=false;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{called=true;return new Response('unexpected')};
  try{
    const response=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/realtime/session',{
      method:'POST',
      headers:{'Content-Type':'application/sdp'},
      body:'v=0\r\n'
    }),{OPENAI_API_KEY:'test-only-key',AGGY_USAGE_METERS:fakeUsageMeters()});
    assert.equal(response.status,402);
    assert.equal((await response.json()).error,'usage_lease_required');
    assert.equal(called,false);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Usage API and health fail closed when the Durable Object binding is absent',async()=>{
  const status=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/usage/status'),{});
  assert.equal(status.status,503);
  assert.equal((await status.json()).failClosed,true);
  const health=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/realtime/health'),{OPENAI_API_KEY:'test-only-key'});
  assert.equal(health.status,503);
  assert.equal((await health.json()).usageMeter,'not_configured');
});

test('Usage API forwards paid continuation only after an explicit user confirmation',async()=>{
  const forwarded=[];
  const meters={
    idFromName:name=>name,
    get:()=>({
      fetch:async request=>{
        forwarded.push(await request.json());
        return new Response(JSON.stringify({
          error:'paid_continuation_confirmation_required',
          paymentRequired:true,
          consentRequired:true,
          wallet:{balance:1_000_000},
          free:{remainingSeconds:0},
          continuation:{customerQVit:200_000}
        }),{status:402,headers:{'Content-Type':'application/json'}});
      }
    })
  };
  for(const paidContinuationConfirmed of [false,true]){
    const response=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/usage/lease',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept-Language':'es-CO'},
      body:JSON.stringify({paidContinuationConfirmed})
    }),{AGGY_USAGE_METERS:meters});
    assert.equal(response.status,402);
  }
  assert.equal(forwarded[0].paidContinuationConfirmed,false);
  assert.equal(forwarded[1].paidContinuationConfirmed,true);
  assert.match(forwarded[0].capabilityHash,/^[a-f0-9]{64}$/);
});

test('Aggy accepts only a valid signed QuPay wallet binding',async()=>{
  const secret='shared-wallet-binding-secret';
  const now=Date.now();
  const encodedPayload=Buffer.from(JSON.stringify({
    schema:'secquoia.qupay.aggy-wallet-binding.v1',
    walletReference:'w'.repeat(43),
    packId:'qvit-ai-credit-5',
    providerSessionId:'cs_live_paid_confirmation_123456',
    issuedAt:now,
    expiresAt:now+60_000
  })).toString('base64url');
  const signature=createHmac('sha256',secret).update(encodedPayload).digest('hex');
  const binding=await workerModule.verifyAggyWalletBinding(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
    headers:{'X-Aggy-Wallet-Binding':`${encodedPayload}.${signature}`}
  }),secret);
  assert.equal(binding.walletReference,'w'.repeat(43));
  assert.equal(binding.packId,'qvit-ai-credit-5');
  await assert.rejects(
    workerModule.verifyAggyWalletBinding(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
      headers:{'X-Aggy-Wallet-Binding':`${encodedPayload}.${'0'.repeat(64)}`}
    }),secret),
    /invalid_wallet_binding/
  );
});

test('QuCFA reconstructs exact governed payment terms from the durable QVit ledger',()=>{
  assert.deepEqual(workerModule.paymentTermsFromQVit(1_000_000),{
    amountUsd:1,
    amountUsdCents:100,
    voiceLiveMinutes:5,
    packId:'qvit-ai-credit-1',
    qvitAmount:1_000_000
  });
  assert.deepEqual(workerModule.paymentTermsFromQVit(5_000_000,'qvit-ai-credit-5'),{
    amountUsd:5,
    amountUsdCents:500,
    voiceLiveMinutes:25,
    packId:'qvit-ai-credit-5',
    qvitAmount:5_000_000
  });
  assert.equal(workerModule.paymentTermsFromQVit(1_000_000,'qvit-ai-credit-5'),null);
  assert.equal(workerModule.paymentTermsFromQVit(750_000),null);
});

test('Pending payment acknowledgment is exposed only through a signed wallet and acknowledged audibly',async()=>{
  const secret='shared-wallet-binding-secret';
  const now=Date.now();
  const encodedPayload=Buffer.from(JSON.stringify({
    schema:'secquoia.qupay.aggy-wallet-binding.v1',
    walletReference:'w'.repeat(43),
    packId:'qvit-ai-credit-1',
    providerSessionId:'cs_live_paid_confirmation_123456',
    issuedAt:now,
    expiresAt:now+60_000
  })).toString('base64url');
  const signature=createHmac('sha256',secret).update(encodedPayload).digest('hex');
  const binding=`${encodedPayload}.${signature}`;
  const forwarded=[];
  const meters={
    idFromName:name=>name,
    get:()=>( {
      fetch:async request=>{
        const body=await request.json();
        forwarded.push({path:new URL(request.url).pathname,body});
        if(new URL(request.url).pathname==='/status')return new Response(JSON.stringify({
          wallet:{balance:1_000_000},
          free:{remainingSeconds:0},
          continuation:{customerQVit:200_000},
          pendingPaymentAcknowledgment:body.includePendingPaymentAcknowledgment?{
            schema:'secquoia.aggy.payment-acknowledgment.v1',
            acknowledgmentId:'11111111-1111-4111-8111-111111111111',
            amountUsd:1,
            voiceLiveMinutes:5,
            packId:'qvit-ai-credit-1'
          }:null
        }),{headers:{'Content-Type':'application/json'}});
        return new Response(JSON.stringify({acknowledged:true,duplicate:false}),{headers:{'Content-Type':'application/json'}});
      }
    })
  };
  const unsigned=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/usage/status'),{AGGY_USAGE_METERS:meters,AGGY_QUPAY_WEBHOOK_SECRET:secret});
  assert.equal((await unsigned.json()).pendingPaymentAcknowledgment,null);
  const signedHeaders={'X-Aggy-Wallet-Binding':binding};
  const signed=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{headers:signedHeaders}),{AGGY_USAGE_METERS:meters,AGGY_QUPAY_WEBHOOK_SECRET:secret});
  assert.equal((await signed.json()).pendingPaymentAcknowledgment.amountUsd,1);
  const acknowledged=await workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/usage/payment-ack',{
    method:'POST',
    headers:{...signedHeaders,'Content-Type':'application/json'},
    body:JSON.stringify({acknowledgmentId:'11111111-1111-4111-8111-111111111111',audiblePlaybackStarted:true,responseCompleted:true})
  }),{AGGY_USAGE_METERS:meters,AGGY_QUPAY_WEBHOOK_SECRET:secret});
  assert.equal(acknowledged.status,200);
  assert.equal(forwarded.at(-1).path,'/payment-ack');
  assert.equal(forwarded.at(-1).body.audiblePlaybackStarted,true);
});

test('Marketplace exhausted state opens a focused continuity dialog and a direct Time AI route',()=>{
  for(const id of ['aggyContinuityDialog','aggyContinuityClose','aggyContinuityChat']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/Tiempo gratis agotado · continuar/);
  assert.match(html,/Chat seguro o paquetes de Tiempo IA/);
  assert.match(html,/assistant-launcher\[data-expired="true"\]/);
  assert.match(html,/aggyContinuityDialog\.showModal\(\)/);
  assert.match(html,/openAgent\(\);document\.querySelector\('\[data-open-aggy-panel="chat"\]'\)\?\.click\(\)/);
  assert.match(html,/new URL\('https:\/\/secquoia\.net\/aggy-time-ai\.html'\)/);
  assert.match(html,/url\.searchParams\.set\('pack',packId\)/);
  assert.match(html,/type:'secquoia:aggy:open-time-ai'/);
  assert.match(html,/Sin renovación automática/);
  for(const pack of ['qvit-ai-credit-1','qvit-ai-credit-5','qvit-ai-credit-10','qvit-ai-credit-25','qvit-ai-credit-50','qvit-ai-credit-100','qvit-ai-credit-500','qvit-ai-credit-1000']){
    assert.match(html,new RegExp(`data-time-ai-pack="${pack}"`));
  }
});

test('A stale usage heartbeat cannot overwrite a deliberate Voice LIVE close',()=>{
  assert.match(voice,/const heartbeatLeaseId=usageLease\?\.leaseId/);
  assert.match(voice,/if\(!connected\|\|!heartbeatLeaseId\|\|usageLease\?\.leaseId!==heartbeatLeaseId\)return/);
  assert.match(voice,/usageUi\('Sesión finalizada','Aggy cerró la sesión de voz y está actualizando tu acceso y saldo\.'/);
});

test('Voice client exposes ten free minutes, warns at 5/3/1 and keeps one visible continuation action',()=>{
  for(const id of ['aggyUsageMeter','aggyUsageLabel','aggyUsageDetail','aggyUsageContinue','aggyUsageMarketplace']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html,/id="aggyUsageAction"|id="aggyUsageTopUp"/);
  assert.match(voice,/\/api\/aggy\/usage/);
  assert.match(voice,/acquireUsageLease/);
  assert.match(voice,/X-Aggy-Lease-Capability/);
  assert.match(voice,/reportUsage\(message\)/);
  assert.match(voice,/usagePost\('heartbeat'\)/);
  assert.match(voice,/channel\.addEventListener\('open',async\(\)=>\{/);
  assert.match(voice,/usagePost\('start'\)/);
  assert.match(worker,/api\/aggy\/usage\/start/);
  assert.match(voice,/cancelUsage\('SESSION_START_FAILED'\)/);
  assert.match(worker,/api\/aggy\/usage\/cancel/);
  assert.match(voice,/endVoice\('CLIENT_HARD_STOP'\)/);
  assert.match(html,/Ver paquetes de Tiempo IA/);
  assert.match(worker,/qupay_credit_not_configured/);
  assert.match(worker,/ASSISTED_ACTIVATION_REQUIRED/);
  assert.match(worker,/AGGY_MAX_PAID_BLOCKS_DAY=240/);
  assert.match(worker,/AGGY_MAX_PAID_BLOCKS_MONTH=3000/);
  assert.match(worker,/let duration=freeRemaining/);
  assert.match(worker,/paid_continuation_confirmation_required/);
  assert.match(worker,/paidContinuationConfirmed===true/);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.freeSeconds,600);
  assert.match(worker,/TEN_MINUTES_THEN_EXPLICIT_QVIT/);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.freeScope,'SECQUOIA_ECOSYSTEM_USER');
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.freeClockStarts,'FIRST_LIVE_VOICE_SESSION');
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.paidContinuationConsentRequired,true);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.silentPaidContinuationAllowed,false);
  for(const threshold of [300,180,60])assert.match(voice,new RegExp(`thresholdSeconds:${threshold}`));
  assert.match(voice,/notifyFreeTimeRemaining\(result\.remainingSeconds\)/);
  assert.match(voice,/usageLease\?\.kind!=='FREE'/);
  assert.match(voice,/seguir por chat/);
  assert.match(voice,/paquete de Tiempo IA/);
  assert.match(voice,/Tu recorrido de Voz LIVE finalizó/);
  assert.match(voice,/startRealtime\(true,\{userInitiated:true\}\)/);
  assert.match(voice,/JSON\.stringify\(\{paidContinuationConfirmed\}\)/);
  assert.match(worker,/PREPAID_ONE_MINUTE_MICROLEASE/);
  assert.match(voice,/retention_ratio:\.8/);
  assert.match(worker,/AGGY_QUPAY_WEBHOOK_SECRET/);
  assert.match(worker,/QUPAY_CONFIRMED_QVIT_CREDIT/);
});

test('QuOptio selects the safest eligible continuation without silent charges',()=>{
  const now=2_000_000_000_000;
  const account={qvit_balance:workerModule.AGGY_PAID_BLOCK_QVIT,paid_blocks_day:0,paid_blocks_month:0};
  const free=workerModule.evaluateQuOptioDecision({account,entitlement:null,freeRemainingMs:60_000,now});
  assert.equal(free.mode,'VISITOR_FREE');
  assert.equal(free.durationSeconds,60);
  assert.equal(free.silentChargeAllowed,false);
  const consent=workerModule.evaluateQuOptioDecision({account,entitlement:null,freeRemainingMs:0,now});
  assert.equal(consent.mode,'CONSENT_REQUIRED');
  assert.equal(consent.reservedQVit,0);
  const paid=workerModule.evaluateQuOptioDecision({account,entitlement:null,freeRemainingMs:0,paidContinuationConfirmed:true,now});
  assert.equal(paid.mode,'PAID_QVIT');
  assert.equal(paid.reservedQVit,workerModule.AGGY_PAID_BLOCK_QVIT);
  assert.equal(paid.overdraftAllowed,false);
});

test('Time AI purchase preserves one explicit continuation action and all governed packages',()=>{
  assert.match(html,/\.btn\.primary\{[^}]*color:#000!important;[^}]*text-shadow:none/);
  assert.match(html,/let qupayCheckoutPending=false/);
  assert.match(html,/aria-busy/);
  assert.match(html,/QuPay–QuFense no respondió/);
  assert.match(html,/qvit-ai-credit-\(1\|5\|10\|25\|50\|100\|500\|1000\)/);
  assert.match(html,/id="ai-services"/);
  assert.match(html,/id="aggyUsageMarketplace"[^>]+target="_top"[^>]+rel="noopener"/);
  assert.match(voice,/usageMarketplaceLink\.href=usageMarketplaceUrl/);
  assert.match(voice,/marketplaceUrl:usageMarketplaceUrl/);
  assert.match(html,/Ver paquetes de Tiempo IA/);
  assert.match(html,/postMessage\(\{type:'secquoia:aggy:open-time-ai'/);
  assert.match(addons,/activationParams\.get\('time_ai'\)==='1'\?'ai':'all'/);
  assert.match(addons,/getElementById\('ai-services'\)\?\.scrollIntoView/);
  assert.match(worker,/aggy-time-ai\.html\?pack=qvit-ai-credit-1&wallet_ref=/);
  assert.doesNotMatch(worker,/addon=qvit-ai-credit-1&wallet_ref=/);
});

test('Post-payment Voice LIVE confirms value, time and consultative continuation paths aloud',()=>{
  assert.match(voice,/He recibido la confirmación segura de USD \$\{paidAmount\}/);
  assert.match(voice,/\$\{paidMinutes\} minutos adicionales de conversación Voice LIVE/);
  assert.match(voice,/identify and acquire the right SECQUOIA product or service/);
  assert.match(voice,/receive technical or commercial support/);
  assert.match(voice,/advance the deployment of an already selected product/);
  assert.match(voice,/pendingPaymentAcknowledgment/);
  assert.match(voice,/\/payment-ack/);
  assert.match(voice,/audiblePlaybackStarted:true/);
  assert.match(voice,/responseCompleted:true/);
  assert.match(voice,/paymentGreetingAckInFlight/);
});

test('Cross-site paid return resumes Voice LIVE with exact commercial-consultative acknowledgment',()=>{
  assert.match(voice,/paymentFragment=new URLSearchParams\(location\.hash\.replace/);
  assert.match(voice,/params\.get\('payment'\)[\s\S]{0,180}params\.get\('aggy_payment'\)[\s\S]{0,180}paymentFragment\.get\('payment'\)[\s\S]{0,180}paymentFragment\.get\('aggy_payment'\)/);
  assert.match(voice,/startRealtime\(true,\{userInitiated:permissionState!=='granted',postPayment:paidConfirmation\}\)/);
  assert.match(voice,/¡Pago confirmado! Muchas gracias por continuar conmigo/);
  assert.match(voice,/single most important objective, blocker or decision/);
  assert.match(voice,/for\(let attempt=0;attempt<40/);
  assert.match(voice,/paidBalanceAvailable=[\s\S]{0,180}lastUsageStatus\?\.wallet\?\.balance/);
  assert.match(voice,/startRealtime\(Boolean\(paid\|\|paidBalanceAvailable\)/);
});

test('Time AI package selection resumes through QuIdentify before QuPay Checkout',()=>{
  assert.match(html,/function timeAiIdentityReturnUrl\(packId,walletReference\)/);
  assert.match(html,/async function resolveTimeAiWalletReference\(candidate\)/);
  assert.match(html,/fetch\('https:\/\/aggy\.secquoia\.group\/api\/aggy\/usage\/status'/);
  assert.match(html,/const walletReference=await resolveTimeAiWalletReference\(params\.get\('wallet_ref'\)\)/);
  assert.match(html,/url\.searchParams\.set\('checkout','time_ai'\)/);
  assert.match(html,/quIdentifyStartUrl\(timeAiIdentityReturnUrl\(pack\.id,walletReference\),'time_ai_checkout'\)/);
  assert.match(html,/confirmes en Stripe/);
  assert.match(addons,/Elegir y continuar/);
  assert.match(addons,/resumeTimeAiCheckout=activationParams\.get\('checkout'\)==='time_ai'&&activationParams\.get\('quidentify'\)==='verified'/);
  assert.match(addons,/cleanUrl\.searchParams\.delete\('checkout'\)/);
  assert.match(addons,/setTimeout\(\(\)=>checkoutButton\(\)\?\.click\(\),0\)/);
  assert.doesNotMatch(addons,/button\.disabled=true/);
});

test('QuIdentify contract entitlements are signed, expiry-bound and tamper-evident',async()=>{
  const secret='test-only-entitlement-secret-with-32-bytes';
  const issued=await workerModule.issueAggyEntitlement({
    subject:'customer-42',
    contractId:'contract-2026-42',
    serviceId:'qufense-enterprise',
    contractEndsAt:new Date(Date.now()+86_400_000).toISOString()
  },secret);
  const entitlement=await workerModule.verifyAggyEntitlement(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
    headers:{Authorization:`Bearer ${issued.token}`}
  }),secret);
  assert.equal(entitlement.accessMode,'CONTRACT_INCLUDED');
  assert.equal(entitlement.contractId,'contract-2026-42');
  assert.equal(entitlement.serviceId,'qufense-enterprise');
  const [entitlementHeader,entitlementPayload,entitlementSignature]=issued.token.split('.');
  const tamperedSignature=`${entitlementSignature[0]==='A'?'B':'A'}${entitlementSignature.slice(1)}`;
  await assert.rejects(
    workerModule.verifyAggyEntitlement(new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
      headers:{Authorization:`Bearer ${entitlementHeader}.${entitlementPayload}.${tamperedSignature}`}
    }),secret),
    /invalid_entitlement_signature/
  );
});

test('QuIdentify Ecosystem Preview is SuperAdmin-only, expiring and epoch-revocable',async()=>{
  const secret='test-only-entitlement-secret-with-32-bytes';
  const request={
    accessProfile:'ECOSYSTEM_PREVIEW',
    subject:'quidentify:eddie',
    grantId:'preview-internal-2026-07',
    projectId:'secquoia-ecosystem-validation',
    reason:'Owner browser testing',
    issuedByRole:'SUPERADMIN',
    validUntil:new Date(Date.now()+7*86_400_000).toISOString()
  };
  const issued=await workerModule.issueAggyEntitlement(request,secret,'epoch-test-1');
  const entitlementRequest=new Request('https://aggy.secquoia.group/api/aggy/usage/status',{
    headers:{Authorization:`Bearer ${issued.token}`}
  });
  const entitlement=await workerModule.verifyAggyEntitlement(entitlementRequest,secret,'epoch-test-1');
  assert.equal(entitlement.accessMode,'ECOSYSTEM_PREVIEW');
  assert.equal(entitlement.grantId,request.grantId);
  assert.equal(entitlement.projectId,request.projectId);
  await assert.rejects(
    workerModule.verifyAggyEntitlement(entitlementRequest,secret,'epoch-revoked'),
    /preview_entitlement_revoked_or_invalid/
  );
  await assert.rejects(
    workerModule.issueAggyEntitlement({...request,issuedByRole:'USER'},secret,'epoch-test-1'),
    /invalid_entitlement_request/
  );
  assert.match(worker,/superadmin_required_for_preview/);
  assert.match(worker,/AGGY_PREVIEW_MAX_MS=90\*24\*60\*60\*1000/);
});

test('Ecosystem Preview issuance endpoint fails closed and requires QuIdentify SuperAdmin',async()=>{
  const env={
    AGGY_ENTITLEMENT_SIGNING_SECRET:'test-only-entitlement-signing-secret-with-32-bytes',
    AGGY_ENTITLEMENT_ISSUER_SECRET:'test-only-entitlement-issuer-secret-with-32-bytes',
    AGGY_PREVIEW_POLICY_EPOCH:'epoch-http-test'
  };
  const body={
    accessProfile:'ECOSYSTEM_PREVIEW',
    subject:'quidentify:eddie',
    grantId:'preview-http-2026-07',
    projectId:'secquoia-ecosystem-validation',
    reason:'Owner browser testing',
    validUntil:new Date(Date.now()+7*86_400_000).toISOString()
  };
  const issue=role=>workerModule.default.fetch(new Request('https://aggy.secquoia.group/api/aggy/entitlements/issue',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Aggy-Issuer-Secret':env.AGGY_ENTITLEMENT_ISSUER_SECRET,
      ...(role?{'X-QuIdentify-Role':role}:{})
    },
    body:JSON.stringify(body)
  }),env);
  const denied=await issue('USER');
  assert.equal(denied.status,403);
  assert.equal((await denied.json()).error,'superadmin_required_for_preview');
  const issued=await issue('SUPERADMIN');
  assert.equal(issued.status,201);
  const payload=await issued.json();
  assert.equal(payload.accessMode,'ECOSYSTEM_PREVIEW');
  assert.equal(payload.qvitDebit,false);
  assert.equal(payload.trialApplied,false);
  assert.match(payload.token,/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});
