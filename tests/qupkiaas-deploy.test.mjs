import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base=new URL('../',import.meta.url);
const html=readFileSync(new URL('qupkiaas-deploy.html',base),'utf8');
const js=readFileSync(new URL('qupkiaas-deploy.js',base),'utf8');
const market=readFileSync(new URL('qu-market.html',base),'utf8');

test('QuPKIaaS QuDeploy portal exposes five governed stages and API path',()=>{
  for(const step of ['Identity','Key custody','CSR','Issue','Deliver'])assert.match(html,new RegExp(step,'i'));
  for(const route of [
    'POST /v1/certificates/requests',
    'GET  /v1/certificates/requests/{requestId}',
    'GET  /v1/certificates/requests/{requestId}/certificate',
    'POST /v1/certificates/requests/{requestId}/revoke'
  ])assert.ok(html.includes(route),route);
  assert.match(market,/href="qupkiaas-deploy\.html"/);
});

test('QuPKIaaS portal never accepts or claims delivery of private keys',()=>{
  assert.match(html,/private key(?:\s*:\s*|\s+)never accepted/i);
  assert.doesNotMatch(html,/type="file"[^>]*(?:private|secret|key)/i);
  assert.match(js,/privateKeyProvided:false/);
  assert.match(js,/privateKeyTransferred:false/);
});

test('CSR transmission is gated by verified identity and live API',()=>{
  assert.match(js,/state\.identityVerified&&state\.apiReady/);
  assert.match(js,/credentials:'include'/);
  assert.match(js,/idempotency-key/);
  assert.match(js,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(js,/rawStored:false/);
});

test('QuPKIaaS exposes the explicit Entrust parallel provider without silent fallback',()=>{
  assert.match(html,/value="ENTRUST_CA_GATEWAY">Entrust CA Gateway/);
  assert.match(js,/provider:\$\('#provider'\)\.value/);
  assert.match(market,/Entrust CA Gateway ready/);
  assert.doesNotMatch(market,/EndTrush|EndTrust/);
});

test('QuPKIaaS portal JavaScript parses',()=>{
  new Function(js);
});
