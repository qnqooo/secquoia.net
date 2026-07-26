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

test('Marketplace header keeps only the requested direct controls',()=>{
  assert.match(header,/id="headerSupport"[^>]*>QuSupport · Aggy/);
  assert.match(header,/href="#deployment">QuDeploy/);
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
      headers:{'Content-Type':'application/sdp'},
      body:'v=0\r\no=aggy 1 1 IN IP4 127.0.0.1\r\n'
    }),{OPENAI_API_KEY:'test-only-key',OPENAI_REALTIME_VOICE:'echo'});
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
      headers:{'Content-Type':'application/sdp'},
      body:'v=0\r\no=aggy 1 1 IN IP4 127.0.0.1\r\n'
    }),{OPENAI_API_KEY:'test-only-key'});
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
  assert.equal(release.version,'1.0.0-rc.9');
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
    }),{OPENAI_API_KEY:'test-only-key',OPENAI_REALTIME_VOICE:'echo'});
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
