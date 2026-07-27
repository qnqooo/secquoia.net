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
  for(const id of ['aggyCreateRoom','aggyJoinRoom','aggySecureComposer','aggyMyFingerprint','aggyPeerFingerprint']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(config,/"new_sqlite_classes"/);
  assert.match(config,/"AGGY_CHAT_ROOMS"/);
  assert.match(config,/"AGGY_GLASSWALL_MODE": "STRUCTURE_READY_NOT_CONNECTED"/);
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

test('plaintext envelopes and active attachment scanning claims fail closed',async()=>{
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
  assert.match(worker,/externalCallsExecuted:false/);
  assert.doesNotMatch(worker,/glasswall\.com|api\.glasswall/);
});
