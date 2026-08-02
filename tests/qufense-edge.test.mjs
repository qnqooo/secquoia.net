import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source=await readFile(new URL('../workers/qufense-edge.js',import.meta.url),'utf8');
const worker=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('QuFense edge fails closed without its mesh secret',async()=>{
  const response=await worker.default.fetch(new Request('https://qufense.internal/readyz'),{});
  assert.equal(response.status,503);
  assert.equal((await response.json()).failClosed,true);
});

test('QuFense edge exposes only readiness and Checkout authorization',async()=>{
  const response=await worker.default.fetch(new Request('https://qufense.internal/v1/authority/public'),{
    SQAILE_MESH_SERVICE_TOKEN:'m'.repeat(32)
  });
  assert.equal(response.status,404);
});

test('QuFense authorizes only hash-bound rebuilt CDR results',async()=>{
  const env={SQAILE_MESH_SERVICE_TOKEN:'m'.repeat(32)};
  const valid=await worker.default.fetch(new Request('https://qufense.internal/v1/cdr/authorize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    schema:'secquoia.quhub.cdr.authorization-request.v1',provider:'glasswall-halo',inputSha256:'a'.repeat(64),outputSha256:'b'.repeat(64),inputBytes:12,outputBytes:10
  })}),env);
  assert.equal(valid.status,200);
  assert.equal((await valid.json()).allowed,true);
  const unchanged=await worker.default.fetch(new Request('https://qufense.internal/v1/cdr/authorize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    schema:'secquoia.quhub.cdr.authorization-request.v1',provider:'glasswall-halo',inputSha256:'a'.repeat(64),outputSha256:'a'.repeat(64),inputBytes:12,outputBytes:12
  })}),env);
  assert.equal(unchanged.status,422);
});
