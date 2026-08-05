import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AGGY_AGENTIC_POLICY,agenticPolicyMessage,classifyAgenticRequest} from '../workers/aggy-agentic-policy.js';

const benchmark=JSON.parse(await readFile(new URL('../aggy-agentic-benchmark.json',import.meta.url),'utf8'));

test('benchmark contains 25 unique official-source products',()=>{
  assert.equal(benchmark.products.length,25);
  assert.equal(new Set(benchmark.products.map(product=>product.id)).size,25);
  for(const product of benchmark.products){
    assert.match(product.source,/^https:\/\//);
    assert.ok(product.strengths.length>=3);
    assert.ok(product.adopt.length>12);
  }
  for(const principle of ['additive_no_regression','no_private_chain_of_thought_exposure','human_approval_before_external_side_effects','e2ee_pqc_preserved']){
    assert.ok(benchmark.adoptionPrinciples.includes(principle));
  }
});

test('policy preserves governance and approval boundaries',()=>{
  assert.equal(AGGY_AGENTIC_POLICY.status,'CANDIDATE_NOT_PROMOTED');
  for(const control of ['payment','deploy','publish','security_policy_change','external_message']){
    assert.ok(AGGY_AGENTIC_POLICY.approvalRequired.includes(control));
  }
  const profile=classifyAgenticRequest([{role:'user',content:'Publica este despliegue en producción'}]);
  assert.equal(profile.mode,'guided_workflow');
  assert.equal(profile.risk,'high');
  assert.ok(profile.specialists.includes('QuDeploy'));
  const policy=agenticPolicyMessage(profile).content;
  assert.match(policy,/explicit human approval/i);
  assert.match(policy,/Do not claim.*succeeded/i);
});

test('policy selects bounded specialists without pretending they ran',()=>{
  const incident=classifyAgenticRequest([{role:'user',content:'Tenemos un incidente de ransomware'}]);
  assert.deepEqual(incident.specialists,['QuSOC','QuFense','QuCISO']);
  const research=classifyAgenticRequest([{role:'user',content:'Haz un benchmark con fuentes'}]);
  assert.deepEqual(research.specialists,['QuHub','QuAudit']);
  assert.match(agenticPolicyMessage(research).content,/Do not claim that a specialist ran/);
});

test('voice prompt keeps human-like transparency, Colombian identity, approval and E2EE/PQC',async()=>{
  const voice=await readFile(new URL('../aggy-realtime-voice.js',import.meta.url),'utf8');
  assert.match(voice,/Colombian accent/);
  assert.match(voice,/transparent that you are an AI assistant/);
  assert.match(voice,/Never expose or fabricate private chain-of-thought/);
  assert.match(voice,/obtain explicit human approval/);
  assert.match(voice,/E2EE\/PQC controls/);
});

test('QuHub applies and traces the policy server-side',async()=>{
  const gateway=await readFile(new URL('../workers/quhub-llm-gateway.js',import.meta.url),'utf8');
  assert.match(gateway,/classifyAgenticRequest\(messages\)/);
  assert.match(gateway,/agenticPolicyMessage\(agenticProfile\)/);
  assert.match(gateway,/agentic:\{policyVersion:AGGY_AGENTIC_POLICY\.version,\.\.\.agenticProfile\}/);
});
