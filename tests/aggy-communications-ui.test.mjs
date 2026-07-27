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
  const [html,client]=await Promise.all([read('qu-market.html'),read('aggy-marketplace.js')]);
  assert.match(html,/class="assistant-input aggy-composer"/);
  assert.match(html,/data-chat-attach/);
  assert.match(html,/data-chat-call="audio"/);
  assert.match(html,/data-chat-call="video"/);
  assert.match(html,/E2EE\/PQC/);
  assert.match(client,/CUARENTENA PREPARADA/);
  assert.match(client,/Aggy verificará E2EE\/PQC antes de solicitar permisos/);
});

test('individual and group calls are fail closed before E2E evidence',async()=>{
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
  assert.equal(release.version,'1.0.0-rc.13');
  assert.match(html,/v1\.0\.0-rc\.13/);
  assert.match(client,/api\/aggy\/calls\/preflight/);
  assert.match(worker,/version:'1\.0\.0-rc\.13'/);
});
