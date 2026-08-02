import assert from 'node:assert/strict';
import test from 'node:test';
import {validateVaultHeaders} from '../workers/aggy-realtime-session.js';

test('QuVault accepts only ciphertext with CDR and QuFense evidence',()=>{
  const valid=validateVaultHeaders(new Headers({
    'Content-Type':'application/octet-stream','X-Aggy-Crypto-Profile':'E2EE/PQC','X-Aggy-Ciphertext-Sha256':'a'.repeat(64),
    'X-QuHub-Lineage-Id':'QH-CDR-1234','X-QuFense-Evidence-Id':'QF-CDR-5678'
  }));
  assert.equal(valid.ciphertextSha256,'a'.repeat(64));
  assert.equal(validateVaultHeaders(new Headers({'Content-Type':'text/plain','X-Aggy-Crypto-Profile':'E2EE/PQC'})),null);
});

test('Aggy production config binds the dedicated ciphertext vault',async()=>{
  const config=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../wrangler.aggy.jsonc',import.meta.url),'utf8'));
  assert.match(config,/"AGGY_QUVAULT_FILES"/);
  assert.match(config,/"v3-aggy-quvault-files"/);
});
