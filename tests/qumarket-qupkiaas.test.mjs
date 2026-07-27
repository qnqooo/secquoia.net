import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../qu-market.html',import.meta.url),'utf8');

test('QuMarket inline application remains syntactically valid',()=>{
  const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  new vm.Script(scripts[0][1],{filename:'qu-market.inline.js'});
});

test('Free PoC exposes governed limits and the complete registration form',()=>{
  assert.match(html,/id="free-poc"/);
  assert.match(html,/10 certificates per participant/);
  assert.match(html,/10 participants per month/);
  assert.match(html,/30-day entitlement/);
  for(const id of ['pocName','pocRole','pocCompany','pocIndustry','pocEmail','pocUseCase','pocTerms','pocPrivacy'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/only QuCOO authorizes the monthly cohort/);
});

test('Free PoC rejects public mailbox domains and minimizes browser data',()=>{
  assert.match(html,/publicMailboxDomains=new Set\(\['gmail\.com'/);
  assert.match(html,/rawEmailStored:false/);
  assert.match(html,/purpose=qupkiaas_free_poc/);
  assert.match(html,/pocForm\.addEventListener\('submit',startPocApplication\)/);
  assert.doesNotMatch(html,/sessionStorage\.setItem\([^,]+,\s*document\.getElementById\('pocEmail'\)/);
});

test('Marketplace typography uses compact responsive bounds',()=>{
  assert.match(html,/h1\{max-width:15ch;font-size:clamp\(38px,4\.35vw,62px\);line-height:1\.01/);
  assert.match(html,/\.product h2\{font-size:clamp\(21px,1\.75vw,27px\)/);
  assert.match(html,/@media\(max-width:600px\)[\s\S]*h1\{max-width:none;font-size:clamp\(32px,10\.5vw,44px\)/);
  assert.doesNotMatch(html,/h1\{max-width:12ch;font-size:clamp\(44px,5\.2vw,76px\)/);
});

test('QuPKIaaS is a governed Marketplace product without unsupported certification claims',()=>{
  assert.match(html,/qupkiaas:\{code:'PKI_TENANT_MONTH'/);
  assert.match(html,/id:'qupkiaas',name:'QuPKIaaS PQC Trust Pilot',base:149/);
  assert.match(html,/ML-DSA private PKI/);
  assert.match(html,/CSR-only/);
  assert.match(html,/live issuance starts only after provider activation, rate-card approval and tenant acceptance/);
  assert.match(html,/External CA, certificate, API and enterprise-provider charges require an approved quote/);
  assert.doesNotMatch(html,/QuPKIaaS[^.\n]*(?:NIST|FIPS|CMVP|CAVP|Common Criteria)[^.\n]*certified/i);
});
