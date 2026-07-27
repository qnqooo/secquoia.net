import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('public SECQUOIA and Aggy surfaces use the canonical E2EE/PQC profile',async()=>{
  const [market,index,bridge,secure,worker,addons]=await Promise.all([
    read('qu-market.html'),
    read('index.html'),
    read('aggy-marketplace.js'),
    read('aggy-secure-chat.js'),
    read('workers/aggy-realtime-session.js'),
    read('qumarket-addons.js')
  ]);
  for(const source of [market,index,bridge,secure,worker,addons])assert.match(source,/E2EE\/PQC/);
  for(const source of [market,index,bridge,secure,worker,addons])assert.doesNotMatch(source,/\bE2E(?!E\/PQC)\b/i);
  assert.match(market,/cifrado de extremo a extremo[^<]+\(E2EE\/PQC\)/i);
  assert.match(market,/end-to-end encryption[^<]+\(E2EE\/PQC\)/i);
  assert.match(worker,/cryptoProfile:'E2EE\/PQC'/);
});

test('normative algorithm identifiers remain exact',async()=>{
  const [cryptoSource,market]=await Promise.all([
    read('src/aggy-secure-chat-crypto.js'),
    read('qu-market.html')
  ]);
  for(const name of ['ML-KEM-768','ML-DSA-65','X25519','AES-256-GCM','XChaCha20-Poly1305']){
    assert.match(cryptoSource,new RegExp(name));
  }
  assert.match(market,/NIST PQC algorithms within the E2EE\/PQC profile/);
});

test('the naming standard preserves certification and evidence boundaries',async()=>{
  const standard=await read('docs/E2EE-PQC-NAMING-STANDARD.md');
  assert.match(standard,/does not by itself claim/);
  assert.match(standard,/Legacy archives, signed evidence, hashes, audit records and historical release notes retain their original wording/);
});
