import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('communication-first navigation preserves existing Aggy capabilities',async()=>{
  const html=await read('qu-market.html');
  for(const panel of ['chat','contacts','calls','groups','more','voice','files','models','security']){
    assert.match(html,new RegExp(`data-market-aggy-panel="${panel}"`));
  }
  assert.match(html,/aria-label="Centro de comunicaciones de Aggy"/);
  assert.match(html,/id="aggyGridToggle"/);
  assert.match(html,/id="aggyAppGrid"/);
  for(const secondary of ['contacts','groups','models','security','more']){
    assert.match(html,new RegExp(`data-open-aggy-panel="${secondary}"`));
  }
});

test('conversation header keeps Voice LIVE files and calls within immediate reach',async()=>{
  const [html,client,css]=await Promise.all([read('qu-market.html'),read('aggy-marketplace.js'),read('aggy-marketplace.css')]);
  assert.match(html,/class="assistant-input aggy-composer"/);
  for(const panel of ['voice','files','calls']){
    assert.equal((html.match(new RegExp(`<button[^>]+data-open-aggy-panel="${panel}"`,'g'))||[]).length,2);
  }
  assert.doesNotMatch(html,/id="aggyAttachmentSheet"|id="aggyAttachDocument"|id="aggyAttachGallery"|id="aggyAttachCamera"/);
  assert.match(html,/id="aggyFile" type="file" multiple/);
  assert.doesNotMatch(html,/data-chat-attach|data-chat-camera|data-chat-call=/);
  assert.match(html,/E2EE\/PQC/);
  assert.match(css,/\.assistant\.open:not\(\.aggy-full\)\{width:min\(720px,calc\(100% - 28px\)\)/);
  assert.match(css,/\.aggy-chat-shell\{display:grid;grid-template-columns:minmax\(0,1fr\);width:100%;min-width:0/);
  assert.match(css,/\.aggy-chat-list\{display:none\}/);
  assert.match(html,/data-open-aggy-panel="chat" data-aggy-thread="assistant"/);
  assert.match(html,/data-open-aggy-panel="chat" data-aggy-thread="secure"/);
  assert.match(html,/<details class="aggy-secure-setup" id="aggySecureSetup">/);
  assert.match(css,/\.aggy-composer button\[hidden\]\{display:none!important\}/);
  assert.doesNotMatch(client,/preflightChatAttachment|openAttachmentSheet/);
  assert.match(client,/syncComposerAction/);
  assert.match(client,/composerSend\.hidden=!hasMessage/);
  assert.match(client,/PENDIENTE: antimalware \+ sandbox \+ CDR/);
  assert.match(client,/Aggy verificará E2EE\/PQC antes de solicitar permisos/);
  assert.match(css,/@media\(max-width:780px\)/);
  assert.match(css,/\.assistant-profile,\.aggy-chat-actions\{display:none\}/);
});

test('chat composer stays focused on messages while secondary controls remain in the grid',async()=>{
  const html=await read('qu-market.html');
  assert.doesNotMatch(html,/class="aggy-primary-actions"/);
  assert.doesNotMatch(html,/class="aggy-chat-actions"/);
  assert.doesNotMatch(html,/class="assistant-profile"/);
  assert.match(html,/id="aggyGridToggle"/);
  assert.doesNotMatch(html,/data-chat-call=|data-chat-attach|data-chat-camera|id="mic"/);
  assert.doesNotMatch(html,/micBtn\.textContent/);
  assert.match(html,/if\(micBtn\)micBtn\.onclick=openAggyVoice/);
  assert.match(html,/id="send"/);
  assert.match(html,/data-market-aggy-panel="more"/);
});

test('individual and group calls are fail closed before E2EE/PQC evidence',async()=>{
  const [html,client,worker]=await Promise.all([
    read('qu-market.html'),
    read('aggy-marketplace.js'),
    read('workers/aggy-realtime-session.js')
  ]);
  assert.match(html,/data-call-kind="individual"/);
  assert.match(html,/data-call-kind="group"/);
  assert.match(html,/id="aggyCallStart"[^>]*disabled/);
  assert.match(client,/e2eeVerified===true/);
  assert.match(client,/gates\.identityBinding===true/);
  assert.match(client,/gates\.signaling===true/);
  assert.match(client,/gates\.keyExchange===true/);
  assert.match(client,/gates\.mediaE2EE===true/);
  assert.match(client,/gates\.qufense===true/);
  assert.match(client,/gates\.quvault===true/);
  assert.doesNotMatch(client,/getUserMedia\s*\(/);
  assert.match(worker,/e2ee_call_infrastructure_not_configured/);
  assert.match(worker,/microphoneRequested:false/);
  assert.match(worker,/cameraRequested:false/);
});

test('Aggy communications release is versioned consistently',async()=>{
  const release=JSON.parse(await read('aggy-release.json'));
  const [html,client,worker]=await Promise.all([
    read('qu-market.html'),
    read('aggy-marketplace.js'),
    read('workers/aggy-realtime-session.js')
  ]);
  assert.equal(release.version,'1.2.3');
  assert.match(html,/v1\.2\.3(?: GA)?/);
  assert.match(client,/api\/aggy\/calls\/preflight/);
  assert.match(worker,/version:'1\.2\.3'/);
});

test('contracted customers bypass the visitor trial without bypassing governance',async()=>{
  const [html,voice,worker]=await Promise.all([
    read('qu-market.html'),
    read('aggy-realtime-voice.js'),
    read('workers/aggy-realtime-session.js')
  ]);
  assert.match(worker,/CONTRACT_INCLUDED/);
  assert.match(worker,/contractedServiceTrialMinutesApplied:false/);
  assert.match(worker,/contractedServiceQVitDebit:false/);
  assert.match(worker,/AGGY_ENTITLEMENT_SIGNING_SECRET/);
  assert.match(voice,/const contractIncluded=isUnmeteredAccess\(accessMode\)/);
  assert.match(worker,/ECOSYSTEM_PREVIEW/);
  assert.match(html,/incluida durante contratos activos; visitantes: 10 minutos gratis/);
});

test('essential communications remain primary and every file operation is receipt-gated',async()=>{
  const [html,worker]=await Promise.all([
    read('qu-market.html'),
    read('workers/aggy-realtime-session.js')
  ]);
  for(const control of ['id="send"','data-open-aggy-panel="voice"','data-open-aggy-panel="files"','data-open-aggy-panel="calls"'])assert.match(html,new RegExp(control));
  for(const receipt of ['CDR_PROVIDER_CLEAN','QUFENSE_ALLOW','E2EE_PQC_ENVELOPE_VERIFIED','QUVAULT_STORED'])assert.match(worker,new RegExp(receipt));
  assert.match(worker,/operationsBlocked:\['send','receive_release','download','store'\]/);
  assert.match(worker,/niapCertified:false/);
  assert.match(worker,/NIAP_ALIGNED_EVALUATION_READY/);
});
