import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [embed,widget,index,notFound]=await Promise.all([
  '../aggy-embed.js',
  '../aggy-widget.html',
  '../index.html',
  '../404.html'
].map(path=>readFile(new URL(path,import.meta.url),'utf8')));

test('Aggy ecosystem embed has valid JavaScript and one-instance protection',()=>{
  new Function(embed);
  assert.match(embed,/window\.__SECQUOIA_AGGY_EMBED__/);
  assert.match(embed,/attachShadow\(\{mode:'open'\}\)/);
  assert.match(embed,/data\.aggySite|dataset\.aggySite/);
});

test('Aggy embed is accessible, responsive and grants only required frame capabilities',()=>{
  assert.match(embed,/aria-expanded/);
  assert.match(embed,/role="dialog"/);
  assert.match(embed,/prefers-reduced-motion/);
  assert.match(embed,/allow="microphone; autoplay"/);
  assert.match(embed,/sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation-by-user-activation"/);
  assert.doesNotMatch(embed,/allow-top-navigation(?:\s|")/);
  assert.doesNotMatch(embed,/camera|geolocation|clipboard-write|payment/);
});

test('Aggy stays compact without stealing focus and starts Voice LIVE automatically',()=>{
  assert.match(embed,/requestAnimationFrame\(\(\)=>setOpen\(false,\{focus:false\}\)\)/);
  assert.match(embed,/const setOpen=\(open,\{focus=true\}=\{\}\)=>/);
  assert.match(embed,/type:'secquoia:aggy:start-voice'/);
  assert.match(embed,/frame\.addEventListener\('load'/);
  assert.match(embed,/requestVoiceStart\(\)/);
  assert.match(embed,/close\.addEventListener\('click',\(\)=>setOpen\(false\)\)/);
  assert.match(embed,/Toca aquí: chat, archivos y llamadas seguras/);
  assert.match(embed,/aggy-guide-pulse/);
  assert.match(embed,/EN VIVO · 10 min gratis/);
  assert.match(embed,/aggy-live-halo/);
  assert.match(embed,/secquoia:aggy:voice-state/);
});

test('Aggy compact launcher exposes a ten-link server-synchronized digital timer',()=>{
  assert.match(embed,/class="minute-chain" role="meter"/);
  assert.match(embed,/repeat\(10\)/);
  assert.match(embed,/secquoia:aggy:usage-state/);
  assert.match(embed,/elapsed=Math\.min\(10,Math\.floor\(\(total-remaining\)\/60\)\)/);
  assert.match(embed,/minute-chain\.exhausted/);
  assert.match(embed,/ECOSYSTEM_PREVIEW/);
});

test('Aggy compact widget uses the governed Realtime voice client only',()=>{
  for(const id of ['aggyVoiceStage','aggyVoiceBadge','aggyVoiceHeadline','aggyVoiceCaption','aggyLanguage','aggyLiveVoice','aggyVoiceMute','aggyVoiceEnd']){
    assert.match(widget,new RegExp(`id="${id}"`));
  }
  assert.match(widget,/Voz de SQAILE - Acento neutro/);
  assert.match(widget,/src="\/aggy-realtime-voice\.js\?v=1\.0\.0-rc\.40"/);
  assert.match(embed,/qu-market\.html\?embed=1&aggy=1/);
  assert.match(embed,/title="Aggy Communications"/);
  assert.doesNotMatch(widget,/speechSynthesis|SpeechSynthesisUtterance|SpeechRecognition|webkitSpeechRecognition|MediaRecorder/);
});

test('SECQUOIA public pages load the local Aggy distribution',()=>{
  assert.match(index,/src="\/aggy-embed\.js\?v=1\.0\.0-rc\.40"[^>]*data-aggy-site="secquoia\.net"/);
  assert.match(notFound,/src="\/aggy-embed\.js\?v=1\.0\.0-rc\.40"[^>]*data-aggy-site="secquoia\.net"/);
});
