import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('communication-first navigation preserves existing Aggy capabilities',async()=>{
  const html=await read('qu-market.html');
  for(const panel of ['chat','contacts','calls','groups','more','voice','files','models','security']){
    assert.match(html,new RegExp(`data-market-aggy-panel="${panel}"`));
  }
  assert.match(html,/data-market-aggy-tab="chat"/);
  assert.match(html,/id="aggyGridToggle"/);
  assert.match(html,/id="aggyAppGrid"/);
  for(const secondary of ['contacts','groups','calls','voice','files','models','security','more']){
    assert.match(html,new RegExp(`data-open-aggy-panel="${secondary}"`));
  }
});

test('chat keeps messages files and encrypted calls within immediate reach',async()=>{
  const [html,client,css]=await Promise.all([read('qu-market.html'),read('aggy-marketplace.js'),read('aggy-marketplace.css')]);
  assert.match(html,/class="assistant-input aggy-composer"/);
  assert.match(html,/data-chat-attach/);
  assert.match(html,/data-chat-camera/);
  assert.match(html,/id="aggyAttachmentSheet"/);
  assert.match(html,/id="aggyCameraInput"[^>]*accept="image\/\*"[^>]*capture="environment"/);
  assert.match(html,/id="aggyGalleryInput"[^>]*accept="image\/\*,video\/\*"[^>]*multiple/);
  assert.match(html,/data-chat-call="audio"/);
  assert.match(html,/data-chat-call="video"/);
  assert.match(html,/E2EE\/PQC/);
  assert.match(css,/\.assistant\.open:not\(\.aggy-full\)\{width:min\(720px,calc\(100% - 28px\)\)/);
  assert.match(css,/\.aggy-chat-shell\{display:grid;grid-template-columns:210px minmax\(0,1fr\);width:100%;min-width:0/);
  assert.match(css,/\.aggy-composer button\[hidden\]\{display:none!important\}/);
  assert.match(client,/preflightChatAttachment/);
  assert.match(client,/syncComposerAction/);
  assert.match(client,/composerSend\.hidden=!hasMessage/);
  assert.match(client,/composerMic\.hidden=hasMessage/);
  assert.match(client,/PENDIENTE: Glasswall \+ QuSOC \+ QuFense \+ E2EE\/PQC \+ QuVault/);
  assert.match(client,/Aggy verificará E2EE\/PQC antes de solicitar permisos/);
  assert.match(css,/@media\(max-width:780px\)/);
  assert.match(css,/\.assistant-profile,\.aggy-chat-actions\{display:none\}/);
});

test('daily communication controls stay one tap away and duplicate launchers stay out of the chat',async()=>{
  const html=await read('qu-market.html');
  assert.doesNotMatch(html,/class="aggy-primary-actions"/);
  assert.doesNotMatch(html,/class="aggy-chat-actions"/);
  assert.doesNotMatch(html,/class="assistant-profile"/);
  assert.match(html,/id="aggyGridToggle"/);
  assert.match(html,/data-chat-call="audio"/);
  assert.match(html,/data-chat-call="video"/);
  assert.match(html,/data-chat-attach aria-label="Adjuntar foto o archivo"/);
  assert.match(html,/data-chat-camera aria-label="Tomar foto"/);
  assert.match(html,/id="mic" aria-label="Hablar con Aggy Voice LIVE"/);
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
  assert.equal(release.version,'1.0.0-rc.33');
  assert.match(html,/v1\.0\.0-rc\.33/);
  assert.match(client,/api\/aggy\/calls\/preflight/);
  assert.match(worker,/version:'1\.0\.0-rc\.33'/);
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
  for(const control of ['id="mic"','id="send"','data-chat-attach','data-chat-camera','data-chat-call="audio"','data-chat-call="video"'])assert.match(html,new RegExp(control));
  for(const receipt of ['CDR_PROVIDER_CLEAN','QUFENSE_ALLOW','E2EE_PQC_ENVELOPE_VERIFIED','QUVAULT_STORED'])assert.match(worker,new RegExp(receipt));
  assert.match(worker,/operationsBlocked:\['send','receive_release','download','store'\]/);
  assert.match(worker,/niapCertified:false/);
  assert.match(worker,/NIAP_ALIGNED_EVALUATION_READY/);
});
