import assert from 'node:assert/strict';
import test from 'node:test';
import {sanitizeCdr} from '../workers/quhub-llm-gateway.js';

const baseEnv=()=>({
  QUHUB_MESH_TOKEN:'m'.repeat(32),
  GLASSWALL_BASE_URL:'https://halo.example/',
  GLASSWALL_API_TOKEN:'provider-secret',
  QUFENSE:{fetch:async(_url,init)=>{
    const body=JSON.parse(init.body);
    assert.equal(body.provider,'glasswall-halo');
    return Response.json({allowed:true,evidenceId:'QF-CDR-1234'});
  }}
});

const request=body=>new Request('https://quhub.secquoia.group/v1/cdr/sanitize',{method:'POST',headers:{Authorization:`Bearer ${'m'.repeat(32)}`,'Content-Type':'application/pdf','X-File-Name':'safe.pdf'},body});

test('QuHub CDR fails closed without provider configuration',async()=>{
  const response=await sanitizeCdr(request('input'),{QUHUB_MESH_TOKEN:'m'.repeat(32)});
  assert.equal(response.status,503);
  assert.equal((await response.json()).failClosed,true);
});

test('QuHub CDR returns only a QuFense-authorized rebuilt artifact',async()=>{
  const response=await sanitizeCdr(request('input'),baseEnv(),{fetchImpl:async(url,init)=>{
    assert.equal(new URL(url).pathname,'/api/v3/cdr-file');
    assert.match(init.headers.Authorization,/^Bearer /);
    return new Response('rebuilt',{status:200,headers:{'Content-Type':'application/pdf'}});
  }});
  assert.equal(response.status,200);
  assert.equal(await response.text(),'rebuilt');
  assert.equal(response.headers.get('X-QuHub-Provider'),'glasswall-halo');
  assert.equal(response.headers.get('X-QuHub-QuFense-Evidence-Id'),'QF-CDR-1234');
});

test('QuHub CDR rejects the wrong mesh capability',async()=>{
  const wrong=new Request('https://quhub.secquoia.group/v1/cdr/sanitize',{method:'POST',headers:{Authorization:`Bearer ${'x'.repeat(32)}`,'X-File-Name':'safe.pdf'},body:'input'});
  const response=await sanitizeCdr(wrong,baseEnv(),{fetchImpl:async()=>new Response('rebuilt')});
  assert.equal(response.status,401);
});
