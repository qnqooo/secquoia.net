import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');
const css=await readFile(new URL('../agenty-marketplace.css',import.meta.url),'utf8');
const voice=await readFile(new URL('../aggy-realtime-voice.js',import.meta.url),'utf8');
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
  assert.match(voice,/const sessionEndpoint='\/api\/aggy\/realtime\/session'/);
  assert.match(voice,/new RTCPeerConnection\(\)/);
  assert.match(voice,/Content-Type':'application\/sdp'/);
  assert.match(voice,/credentials:'same-origin'/);
  assert.match(voice,/turn_detection:\{type:'server_vad',create_response:true,interrupt_response:true\}/);
  assert.match(voice,/startLocalFallback/);
  assert.match(voice,/no es una sesión OpenAI/);
  assert.doesNotMatch(voice,/sk-(?:proj-)?[A-Za-z0-9_-]{8,}|OPENAI_API_KEY|Authorization:\s*`?Bearer/);
});

test('Aggy Voice UI exposes live, mute and end controls with honest state',()=>{
  for(const id of ['aggyLiveVoice','aggyVoiceMute','aggyVoiceEnd','aggyVoiceBadge','aggyVoiceStage']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/GPT‑Realtime‑2\.1 por WebRTC/);
  assert.match(css,/\.aggy-voice-stage/);
  assert.match(css,/\.aggy-orb/);
});
