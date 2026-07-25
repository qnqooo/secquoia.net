import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');
const css=await readFile(new URL('../aggy-marketplace.css',import.meta.url),'utf8');
const voice=await readFile(new URL('../aggy-realtime-voice.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../workers/aggy-realtime-session.js',import.meta.url),'utf8');
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
  assert.match(voice,/new RTCPeerConnection\(\)/);
  assert.match(voice,/Content-Type':'application\/sdp'/);
  assert.match(voice,/credentials:'omit'/);
  assert.match(voice,/turn_detection:\{type:'semantic_vad',eagerness:'auto',create_response:true,interrupt_response:true\}/);
  assert.match(voice,/output:\{voice:naturalVoice\}/);
  assert.match(voice,/contentHint='speech'/);
  assert.doesNotMatch(voice,/X-Aggy-Voice-Model/);
  assert.match(voice,/startLocalFallback/);
  assert.match(voice,/no es una sesión OpenAI/);
  assert.doesNotMatch(voice,/sk-(?:proj-)?[A-Za-z0-9_-]{8,}|OPENAI_API_KEY|Authorization:\s*`?Bearer/);
});

test('Aggy backend keeps the current model and standard API key server-side',()=>{
  assert.match(worker,/DEFAULT_REALTIME_MODEL='gpt-realtime-2\.1'/);
  assert.match(worker,/DEFAULT_REALTIME_VOICE='marin'/);
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
    }),{OPENAI_API_KEY:'test-only-key'});
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

test('Aggy Voice UI exposes live, mute and end controls with honest state',()=>{
  for(const id of ['aggyLiveVoice','aggyVoiceMute','aggyVoiceEnd','aggyVoiceBadge','aggyVoiceStage']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/GPT‑Realtime‑2\.1 por WebRTC/);
  assert.match(css,/\.aggy-voice-stage/);
  assert.match(css,/\.aggy-orb/);
});
