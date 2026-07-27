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
