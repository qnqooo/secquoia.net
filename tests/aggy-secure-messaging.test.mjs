import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {
  createDeviceKeys,
  createRoomSecret,
  decryptMessage,
  encryptMessage
} from '../src/aggy-secure-chat-crypto.js';
import {
  sanitizeChatText,
  sanitizeAttachmentThroughQuHub,
  validateEnvelope,
  validatePublicBundle
} from '../workers/aggy-realtime-session.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;

test('secure chat client assets have valid syntax and governed UI hooks',async()=>{
  const [client,html,config]=await Promise.all([
    readFile(new URL('../aggy-secure-chat.js',import.meta.url),'utf8'),
    readFile(new URL('../qu-market.html',import.meta.url),'utf8'),
    readFile(new URL('../wrangler.aggy.jsonc',import.meta.url),'utf8')
  ]);
  new Function(client);
  assert.match(client,/X-Aggy-Room-Capability/);
  for(const id of ['aggyCreateRoom','aggyJoinRoom','aggySecureComposer','aggyMyFingerprint','aggyPeerFingerprint']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(config,/"new_sqlite_classes"/);
  assert.match(config,/"AGGY_CHAT_ROOMS"/);
  assert.match(config,/"AGGY_GLASSWALL_MODE": "QUHUB_CDR_CONFIGURED_FAIL_CLOSED"/);
  assert.match(config,/"AGGY_QUHUB_CDR_URL": "https:\/\/quhub\.secquoia\.group\/v1\/cdr\/sanitize"/);
});

test('QuSOC text policy normalizes controls and blocks empty payloads',()=>{
  assert.equal(sanitizeChatText('  hola\u202E\r\nmundo\u0000  '),'hola\nmundo');
  assert.throws(()=>sanitizeChatText('\u0000\u200B  '),/empty_after_normalization/);
  assert.throws(()=>sanitizeChatText('x'.repeat(5000)),/text_too_large/);
});

test('Aggy creates verifiable hybrid E2EE/PQC envelopes and rejects tampering',()=>{
  const alice=createDeviceKeys(),bob=createDeviceKeys(),room=createRoomSecret();
  assert.equal(validatePublicBundle(alice.publicBundle),true);
  assert.equal(alice.publicBundle.cryptoProfile,'E2EE/PQC');
  const receipt={
    schema:'secquoia.qusoc.chat-text-admission.v1',
    receiptId:crypto.randomUUID(),
    admissionAuthorized:true,
    quvaultAuthorized:true
  };
  const envelope=encryptMessage({
    roomId:room.roomId,
    text:'Mensaje limpio',
    admissionReceipt:receipt,
    sender:alice,
    recipient:bob.publicBundle
  });
  assert.equal(validateEnvelope(envelope),true);
  assert.equal(envelope.header.cryptoProfile,'E2EE/PQC');
  assert.equal(decryptMessage({
    roomId:room.roomId,
    envelope,
    recipient:bob,
    expectedSenderFingerprint:alice.publicBundle.fingerprint
  }).text,'Mensaje limpio');
  const tampered=structuredClone(envelope);
  tampered.ciphertext=tampered.ciphertext.slice(0,-2)+'AA';
  assert.throws(()=>decryptMessage({roomId:room.roomId,envelope:tampered,recipient:bob}));
});

test('plaintext envelopes fail closed and attachment CDR is mediated only through QuHub',async()=>{
  assert.equal(validateEnvelope({
    header:{schema:'secquoia.aggy.quvault-e2ee-pqc.v1'},
    plaintext:'leak',
    ciphertext:'cipher',
    signature:'sig',
    admissionReceipt:{
      schema:'secquoia.qusoc.chat-text-admission.v1',
      admissionAuthorized:true,
      quvaultAuthorized:true
    }
  }),false);
  const worker=await readFile(new URL('../workers/aggy-realtime-session.js',import.meta.url),'utf8');
  assert.match(worker,/GLASSWALL_NOT_CONNECTED/);
  assert.match(worker,/quhub\.secquoia\.group/);
  assert.doesNotMatch(worker,/glasswall\.com|api\.glasswall|api\.metadefender/);
});

test('attachment CDR verifies rebuilt hashes and requires client E2EE/PQC next',async()=>{
  const input=new TextEncoder().encode('unsafe-source');
  const rebuilt=new TextEncoder().encode('rebuilt-safe');
  const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',value))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  const inputHash=await digest(input),outputHash=await digest(rebuilt),calls=[];
  const request=new Request('https://aggy.secquoia.group/api/aggy/messages/attachments',{method:'POST',headers:{Origin:'https://secquoia.group','Content-Type':'application/pdf','X-Aggy-File-Name':'proposal.pdf','X-Aggy-Ingress-Kind':'DOCUMENT'},body:input});
  const response=await sanitizeAttachmentThroughQuHub({request,env:{AGGY_QUHUB_CDR_URL:'https://quhub.secquoia.group/v1/cdr/sanitize',AGGY_QUHUB_MESH_TOKEN:'m'.repeat(32)},fetchImpl:async(url,options)=>{calls.push({url:String(url),options});return new Response(rebuilt,{status:200,headers:{'Content-Type':'application/octet-stream','X-QuHub-Lineage-Id':'QH-CDR-1234','X-QuHub-Input-Sha256':inputHash,'X-QuHub-Output-Sha256':outputHash,'X-QuHub-Provider':'opswat-metadefender-core','X-QuHub-Audit-Id':'QA-CDR-1','X-QuHub-QuFense-Evidence-Id':'QF-CDR-1'}})}});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('X-Aggy-Next-Step'),'CLIENT_E2EE_PQC_ENCRYPTION_REQUIRED');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),rebuilt);
  assert.equal(calls[0].url,'https://quhub.secquoia.group/v1/cdr/sanitize');
  assert.match(calls[0].options.headers.authorization,/^Bearer /);
  assert.equal(JSON.stringify([...response.headers]).includes('m'.repeat(32)),false);
});

test('attachment CDR rejects untrusted endpoint and mismatched evidence',async()=>{
  const request=()=>new Request('https://aggy.secquoia.group/api/aggy/messages/attachments',{method:'POST',headers:{Origin:'https://secquoia.group','Content-Type':'application/pdf','X-Aggy-File-Name':'proposal.pdf'},body:'unsafe'});
  await assert.rejects(()=>sanitizeAttachmentThroughQuHub({request:request(),env:{AGGY_QUHUB_CDR_URL:'https://attacker.example/v1/cdr/sanitize',AGGY_QUHUB_MESH_TOKEN:'m'.repeat(32)}}),/endpoint_rejected/);
  await assert.rejects(()=>sanitizeAttachmentThroughQuHub({request:request(),env:{AGGY_QUHUB_CDR_URL:'https://quhub.secquoia.group/v1/cdr/sanitize',AGGY_QUHUB_MESH_TOKEN:'m'.repeat(32)},fetchImpl:async()=>new Response('unchanged',{status:200,headers:{'X-QuHub-Lineage-Id':'QH-CDR-1','X-QuHub-Input-Sha256':'0'.repeat(64),'X-QuHub-Output-Sha256':'1'.repeat(64),'X-QuHub-Provider':'opswat','X-QuHub-Audit-Id':'QA-1','X-QuHub-QuFense-Evidence-Id':'QF-1'}})}),/evidence_invalid/);
});
