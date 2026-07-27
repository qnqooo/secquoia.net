import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');
const css=await readFile(new URL('../aggy-marketplace.css',import.meta.url),'utf8');
const voice=await readFile(new URL('../aggy-realtime-voice.js',import.meta.url),'utf8');
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
      if(path==='/status')return new Response(JSON.stringify({free:{remainingSeconds:300},wallet:{balance:0,topUpAvailable:false},continuation:{customerQVit:240000}}),{headers:{'Content-Type':'application/json'}});
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
  assert.match(voice,/await startRealtime\(\)/);
  assert.doesNotMatch(voice,/navigator\.permissions/);
  assert.match(voice,/type:'response\.create'/);
  assert.match(voice,/sendInitialGreeting\(\)/);
  assert.match(voice,/greetingSent/);
  assert.match(voice,/QuGEO selected \$\{language\}/);
  assert.match(voice,/Start speaking immediately/);
  assert.match(voice,/Keep it compact, with no introductory filler or long pause/);
  assert.match(voice,/How can I help you\?/);
  assert.match(voice,/new RTCPeerConnection\(\)/);
  assert.match(voice,/Content-Type':'application\/sdp'/);
  assert.match(voice,/credentials:'omit'/);
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
  assert.doesNotMatch(voice,/sk-(?:proj-)?[A-Za-z0-9_-]{8,}|OPENAI_API_KEY|Authorization:\s*`?Bearer/);
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
  assert.match(worker,/form\.set\('session',session\)/);
  assert.match(worker,/model=env\.OPENAI_REALTIME_MODEL\|\|DEFAULT_REALTIME_MODEL/);
  assert.doesNotMatch(worker,/sk-(?:proj-)?[A-Za-z0-9_-]{8,}/);
  assert.match(worker,/https:\/\/secquoia\.net/);
  assert.match(worker,/Access-Control-Allow-Origin/);
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
    assert.equal(upstreamRequest.init.body.get('sdp'),'v=0\r\no=aggy 1 1 IN IP4 127.0.0.1\r\n');
    assert.deepEqual(JSON.parse(upstreamRequest.init.body.get('session')),{
      type:'realtime',
      model:'gpt-realtime-2.1',
      audio:{output:{voice:'marin'}}
    });
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

test('Aggy publishes one consistent prerelease version and honest commercial status',async()=>{
  assert.match(release.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-[0-9A-Za-z.-]+$/);
  assert.equal(release.version,'1.0.0-rc.20');
  assert.equal(release.channel,'rc');
  assert.equal(release.productionApproved,false);
  assert.equal(release.thirdPartySale,false);
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
    assert.equal(body.release.channel,'rc');
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

test('Marketplace opens Aggy and routes Voice LIVE through the visible governed controls',()=>{
  assert.match(html,/setAssistantState\('expanded',\{persist:false\}\)/);
  assert.match(html,/data-open-aggy-panel="voice"/);
  assert.match(html,/document\.getElementById\('aggyLiveVoice'\)\?\.click\(\)/);
  assert.doesNotMatch(html,/data-market-aggy-tab="voice"/);
  assert.match(html,/Voice LIVE · 5 min gratis/);
});

test('QuCFA prices one prepaid Aggy Minute without overdraft',()=>{
  const quote=workerModule.aggyBlockQuote();
  assert.equal(quote.durationSeconds,60);
  assert.equal(quote.customerQVit,240_000);
  assert.equal(quote.providerReserveUsd,.15);
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
          continuation:{customerQVit:240_000}
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

test('Voice client exposes five free minutes and requires explicit paid continuation',()=>{
  for(const id of ['aggyUsageMeter','aggyUsageLabel','aggyUsageDetail','aggyUsageContinue','aggyUsageTopUp']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(voice,/\/api\/aggy\/usage/);
  assert.match(voice,/acquireUsageLease/);
  assert.match(voice,/X-Aggy-Lease-Capability/);
  assert.match(voice,/reportUsage\(message\)/);
  assert.match(voice,/usagePost\('heartbeat'\)/);
  assert.match(voice,/endVoice\('CLIENT_HARD_STOP'\)/);
  assert.match(voice,/Solicitar activación QuPay/);
  assert.match(worker,/qupay_credit_not_configured/);
  assert.match(worker,/ASSISTED_ACTIVATION_REQUIRED/);
  assert.match(worker,/AGGY_MAX_PAID_BLOCKS_DAY=15/);
  assert.match(worker,/AGGY_MAX_PAID_BLOCKS_MONTH=150/);
  assert.match(worker,/let duration=freeRemaining/);
  assert.match(worker,/paid_continuation_confirmation_required/);
  assert.match(worker,/paidContinuationConfirmed===true/);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.freeSeconds,300);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.freeScope,'SECQUOIA_ECOSYSTEM_USER');
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.freeClockStarts,'FIRST_LIVE_VOICE_SESSION');
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.paidContinuationConsentRequired,true);
  assert.equal(workerModule.AGGY_QUOPTIO_POLICY.silentPaidContinuationAllowed,false);
  assert.match(voice,/5 minutos gratis finalizados/);
  assert.match(voice,/startRealtime\(true\)/);
  assert.match(voice,/JSON\.stringify\(\{paidContinuationConfirmed\}\)/);
  assert.match(worker,/PREPAID_ONE_MINUTE_MICROLEASE/);
  assert.match(voice,/retention_ratio:\.8/);
  assert.match(worker,/AGGY_QUPAY_WEBHOOK_SECRET/);
  assert.match(worker,/QUPAY_CONFIRMED_QVIT_CREDIT/);
});
