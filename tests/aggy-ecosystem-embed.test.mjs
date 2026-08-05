import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [embed,widget,index,notFound,market]=await Promise.all([
  '../aggy-embed.js',
  '../aggy-widget.html',
  '../index.html',
  '../404.html',
  '../qu-market.html'
].map(path=>readFile(new URL(path,import.meta.url),'utf8')));

test('Aggy ecosystem embed has valid JavaScript and one-instance protection',()=>{
  new Function(embed);
  assert.match(embed,/window\.__SECQUOIA_AGGY_EMBED__/);
  assert.match(embed,/attachShadow\(\{mode:'open'\}\)/);
  assert.match(embed,/data\.aggySite|dataset\.aggySite/);
});

test('Aggy embed is accessible, responsive and grants only required frame capabilities',()=>{
  const allow=embed.match(/allow="([^"]*)"/)?.[1]||'';
  assert.match(embed,/aria-expanded/);
  assert.match(embed,/role="dialog"/);
  assert.match(embed,/prefers-reduced-motion/);
  assert.match(embed,/allow="microphone; autoplay"/);
  assert.match(embed,/sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation-by-user-activation"/);
  assert.doesNotMatch(embed,/allow-top-navigation(?:\s|")/);
  assert.doesNotMatch(allow,/camera|geolocation|clipboard-write|payment/);
});

test('Aggy keeps the panel closed by default while Voice LIVE starts automatically',()=>{
  assert.match(embed,/const autoOpen=script\?\.dataset\.aggyAutoOpen==='true'/);
  assert.match(embed,/requestAnimationFrame\(\(\)=>setOpen\(autoOpen,\{focus:false\}\)\)/);
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

test('Aggy sends minimized host context without form values, query strings or raw body content',()=>{
  assert.match(embed,/schema:'secquoia\.aggy\.host-context\.v1'/);
  assert.match(embed,/readHostContext/);
  assert.match(embed,/publishHostContext/);
  assert.match(embed,/secquoia:aggy:host-context/);
  assert.match(embed,/formValuesCaptured:false/);
  assert.match(embed,/bodyDumped:false/);
  assert.match(embed,/queryStringCaptured:false/);
  assert.match(embed,/closest\('form,\[contenteditable="true"\]'\)/);
  assert.doesNotMatch(embed,/document\.body\.innerText/);
  assert.doesNotMatch(embed,/location\.search/);
});

test('QuSOC receives a commander greeting without claiming institutional affiliation or autonomous authority',()=>{
  assert.match(market,/site==='qusoc-command-360'/);
  assert.match(market,/Soy la Comandante Aggy/);
  assert.match(market,/OTAN, USCYBERCOM y Five Eyes/);
  assert.match(market,/sin representarlos ni estar afiliada a ellos/);
  assert.match(market,/QuCISO gobierna, QuFense autoriza y usted conserva el mando humano/);
  assert.match(market,/asesora técnica, comercial, de soporte e implementación/);
  assert.match(market,/roles=\[\.\.\.new Set\(\[\.\.\.\(context\.roles\|\|\[\]\),'TECHNICAL','COMMERCIAL','SUPPORT','IMPLEMENTATION'\]\)\]/);
  assert.match(market,/commandScope=normalizeText/);
  assert.match(market,/qusoc\.\?command\|qusoc\.\{0,20\}360/);
  assert.doesNotMatch(market,/\/qusoc\|cyber\.\?defen\|threat\|soc command\//);
});

test('QuSpace CRM receives a customer and opportunity specific greeting',()=>{
  assert.match(market,/context\.site==='quspace-crm'/);
  assert.match(market,/consultora contextual para QuSpace CRM/);
  assert.match(market,/cuenta, oportunidad o resultado comercial/);
});

test('Aggy compact launcher exposes a ten-link server-synchronized digital timer',()=>{
  assert.match(embed,/class="minute-chain" role="meter"/);
  assert.match(embed,/repeat\(10\)/);
  assert.match(embed,/secquoia:aggy:usage-state/);
  assert.match(embed,/elapsed=Math\.min\(10,Math\.floor\(\(total-remaining\)\/60\)\)/);
  assert.match(embed,/minute-chain\.exhausted/);
  assert.match(embed,/ECOSYSTEM_PREVIEW/);
});

test('Aggy exhausted state is yellow, preserves readable copy and offers explicit continuity choices',()=>{
  assert.match(embed,/launcher\[data-expired="true"\]/);
  assert.match(embed,/Tiempo gratis agotado · continuar/);
  assert.match(embed,/Chat seguro o paquetes de Tiempo IA/);
  assert.match(embed,/class="continuity"/);
  assert.match(embed,/Continuar por Chat seguro/);
  for(const pack of ['qvit-ai-credit-1','qvit-ai-credit-5','qvit-ai-credit-10','qvit-ai-credit-25','qvit-ai-credit-50','qvit-ai-credit-100','qvit-ai-credit-500','qvit-ai-credit-1000']){
    assert.match(embed,new RegExp(`data-pack="${pack}"`));
  }
  assert.match(embed,/new URL\('https:\/\/secquoia\.net\/aggy-time-ai\.html'\)/);
  assert.match(embed,/url\.searchParams\.set\('pack',packId\)/);
  assert.match(embed,/url\.searchParams\.set\('return_to',window\.location\.href\)/);
  assert.match(embed,/launcher\.dataset\.expired==='true'/);
  assert.match(embed,/frame\.contentWindow\?\.postMessage\(\{type:'secquoia:aggy:open-chat'/);
});

test('Aggy automatically resumes Voice LIVE after certified payment without opening chat',()=>{
  assert.match(embed,/class="payment-moment"/);
  assert.match(embed,/Tu conversación continúa\./);
  assert.match(embed,/data-payment-amount/);
  assert.match(embed,/data-payment-minutes/);
  assert.match(embed,/class="payment-route"/);
  assert.match(embed,/secquoia:aggy:payment-confirmed/);
  assert.match(embed,/launcher\.dataset\.paidMinutes=String\(minutes\)/);
  assert.match(embed,/paymentPrimary\.addEventListener\('click'/);
  assert.match(embed,/setPaymentMomentOpen\(true\)/);
  assert.match(embed,/showPaymentMoment=[\s\S]{0,1800}setOpen\(false,\{focus:false\}\)/);
  assert.match(embed,/showPaymentMoment=[\s\S]{0,2000}requestVoiceStart\(\)/);
  assert.match(embed,/paymentPrimary\.addEventListener\('click',[\s\S]{0,220}requestVoiceStart\(\)/);
  assert.match(embed,/aggy_payment/);
  assert.match(embed,/launcher\.dataset\.paidAvailable==='true'[\s\S]{0,260}setOpen\(false,\{focus:false\}\)[\s\S]{0,120}requestVoiceStart\(\)/);
  assert.match(embed,/if\(paymentReturn&&!paymentReturnRecoveryShown&&paidMinutes>0\)/);
  assert.doesNotMatch(embed,/if\(!paymentReturn\)requestVoiceStart\(\)/);
  assert.match(embed,/Pago confirmado · reactivando Voice LIVE/);
  assert.match(embed,/paymentPrimary\.hidden=true/);
  assert.match(embed,/paymentPrimary\.hidden=false/);
  assert.match(embed,/Reintentar Voice LIVE/);
  assert.match(embed,/launcher\.dataset\.continuityRequired=String\(remaining===0\)/);
  assert.match(embed,/continuityRequired[\s\S]{0,260}setContinuityOpen\(true\)/);
  assert.doesNotMatch(embed,/setContinuityOpen\(continuity\.hidden\)/);
  assert.match(embed,/session_id/);
  assert.match(embed,/location\.hash\.replace/);
  assert.match(embed,/sessionStorage\.getItem\(receiptKey\)/);
  assert.match(embed,/sessionStorage\.setItem\(receiptKey,'1'\)/);
  assert.match(embed,/setTimeout\(\(\)=>\{paymentMoment\.hidden=true\},12000\)/);
  assert.match(embed,/window\.addEventListener\('pagehide',\(\)=>setPaymentMomentOpen\(false\)\)/);
  assert.match(embed,/event\.persisted\)setPaymentMomentOpen\(false\)/);
});

test('Aggy compact widget uses the governed Realtime voice client only',()=>{
  for(const id of ['aggyVoiceStage','aggyVoiceBadge','aggyVoiceHeadline','aggyVoiceCaption','aggyLanguage','aggyLiveVoice','aggyVoiceMute','aggyVoiceEnd']){
    assert.match(widget,new RegExp(`id="${id}"`));
  }
  assert.match(widget,/Voz femenina · acento colombiano/);
  assert.match(widget,/src="\/aggy-realtime-voice\.js\?v=1\.3\.0-rc\.2"/);
  assert.match(embed,/new URL\('https:\/\/secquoia\.net\/qu-market\.html'\)/);
  assert.match(embed,/url\.searchParams\.set\('embed','1'\)/);
  assert.match(embed,/url\.searchParams\.set\('aggy','1'\)/);
  assert.match(embed,/title="Aggy Communications"/);
  assert.doesNotMatch(widget,/speechSynthesis|SpeechSynthesisUtterance|SpeechRecognition|webkitSpeechRecognition|MediaRecorder/);
});

test('SECQUOIA public pages load the local Aggy distribution',()=>{
  assert.match(index,/src="\/aggy-embed\.js\?v=1\.3\.0-rc\.2-agentic2-20260805"[^>]*data-aggy-site="secquoia\.net"/);
  assert.match(notFound,/src="\/aggy-embed\.js\?v=1\.3\.0-rc\.2-agentic2-20260805"[^>]*data-aggy-site="secquoia\.net"/);
});

test('SECQUOIA entry pages cache-bust the QuCFA-normalized Aggy distribution',()=>{
  assert.match(embed,/1\.3\.0-rc\.2/);
  assert.match(index,/aggy-embed\.js\?v=1\.3\.0-rc\.2-agentic2-20260805/);
  assert.match(embed,/const assetRevision='1\.3\.0-rc\.2-languages11-20260805'/);
});
