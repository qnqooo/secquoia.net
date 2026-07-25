import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../qu-market.html',import.meta.url),'utf8');

test('QuMarket inline application remains syntactically valid',()=>{
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  new vm.Script(scripts[0][1],{filename:'qu-market.inline.js'});
});

test('Marketplace header is reduced to logo, cart, QuSupport, QuDeploy and language',()=>{
  const header=html.match(/<header class="top">([\s\S]*?)<\/header>/)?.[1]||'';
  const visibleActions=header.match(/<div class="navlinks">([\s\S]*?)<\/div>\s*<div hidden/)?.[1]||'';
  assert.match(header,/class="brand"[^>]*><img[^>]+alt="SECQUOIA"><\/a>/);
  assert.match(visibleActions,/>Cart<\/a>/);
  assert.match(visibleActions,/>Carrito<\/a>/);
  assert.match(visibleActions,/data-open-support/);
  assert.match(visibleActions,/>QuDeploy<\/a>/);
  assert.match(visibleActions,/id="enBtn"/);
  assert.match(visibleActions,/id="esBtn"/);
  assert.doesNotMatch(visibleActions,/>SECQUOIA\.NET<|>Products<|>Deployment<|>QuCFA<|data-bundle/);
  assert.match(html,/<strong>QuSupport<\/strong><span id="agentState">Agenty ready<\/span>/);
  assert.match(html,/querySelectorAll\('\[data-open-support\]'\)/);
});

test('QuPKIaaS exposes Pilot, Growth and Enterprise as tailored quotes',()=>{
  for(const id of ['qupkiaas-pilot','qupkiaas-growth','qupkiaas-enterprise']){
    assert.match(html,new RegExp(`id:'${id}'[^\\n]+unit:'quote'[^\\n]+bundle:false`));
  }
  assert.match(html,/requiresGovernedQuote/);
  assert.match(html,/quoteType:subtotal===null\?'TAILORED':'CATALOG'/);
});

test('QuPKIaaS Free PoC exposes the governed limits and complete registration form',()=>{
  assert.match(html,/id="free-poc"/);
  assert.match(html,/10 certificates per participant/);
  assert.match(html,/10 participants per month/);
  assert.match(html,/30-day entitlement/);
  for(const id of ['pocName','pocRole','pocCompany','pocIndustry','pocEmail','pocUseCase','pocTerms','pocPrivacy']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/QuCOO authorizes the monthly cohort/);
  assert.match(html,/La IA puede asesorar, pero no verifica identidad ni autoriza cupos/);
});

test('Free PoC browser flow rejects public mailbox domains and routes identity verification without raw form PII',()=>{
  assert.match(html,/publicMailboxDomains=new Set\(\['gmail\.com'/);
  assert.match(html,/rawEmailStored:false/);
  assert.match(html,/purpose=qupkiaas_free_poc/);
  assert.match(html,/pocForm\.addEventListener\('submit',startPocApplication\)/);
  assert.doesNotMatch(html,/sessionStorage\.setItem\([^,]+,\s*document\.getElementById\('pocEmail'\)/);
});

test('public marketplace contains no internal commercial model or provider activation data',()=>{
  const forbidden=[
    /\bQuCFA\b/i,
    /\bQVit\b/i,
    /\bcost:\s*\{/i,
    /\bpricingRule\b/i,
    /\bcommercial reserve\b/i,
    /\breserva comercial\b/i,
    /\bcommercial rounding\b/i,
    /\bredondeo comercial\b/i,
    /\bvolume multipliers\b/i,
    /\bmultiplicadores por volumen\b/i,
    /\bManage your profit\b/i,
    /\binternal Opex\b/i,
    /\bOpex interno\b/i,
    /\bDigiCert\b/i,
    /\bAWS KMS\b/i,
    /\bendpointMultipliers\b/,
    /\bflatMultiplier\b/,
    /\bcommercialRoundUp\b/,
    /\bsaleProcessParts\b/,
    /\brenderCostTable\b/
  ];
  for(const pattern of forbidden){
    assert.doesNotMatch(html,pattern);
  }
});

test('catalog uses explicit public prices rather than internal pricing formulas',()=>{
  assert.match(html,/prices:\{'10':349,'25':749,'50':1349,'100':2449/);
  assert.match(html,/function priceFor\(p\)\{const value=p\.prices&&\(p\.prices\[tier\(\)\]/);
  assert.doesNotMatch(html,/\bbase:\s*\d+/);
  assert.doesNotMatch(html,/\bmultiplierFor\b|\brawPriceFor\b/);
});

test('10-endpoint Startup package is retained with governed endpoint prices',()=>{
  assert.match(html,/<option value="10">10 Endpoints — Startup<\/option>/);
  const qufenseLine=html.split(/\r?\n/).find(line=>line.includes("{id:'qufense'"));
  const qusocLine=html.split(/\r?\n/).find(line=>line.includes("{id:'qusoc'"));
  assert.ok(qufenseLine?.includes("prices:{'10':349,'25':749"));
  assert.ok(qusocLine?.includes("prices:{'10':899,'25':1999"));
  assert.match(html,/Startup de 10 endpoints/);
});

test('PQC migration promise is visible without exposing the internal pricing rule',()=>{
  assert.match(html,/Move to PQC‑Ready\. No friction\. No unnecessary overhead\./);
  assert.match(html,/Migra a PQC‑Ready\. Sin fricción\. Sin sobrecostos innecesarios\./);
  assert.match(html,/Migración gradual por diseño/);
  assert.doesNotMatch(html,/1\.10M|market-relative price|mediana comparable/i);
});

test('Marketplace typography keeps the hero and product hierarchy within responsive editorial bounds',()=>{
  assert.match(html,/h1\{max-width:15ch;font-size:clamp\(36px,5\.1vw,66px\);line-height:\.98/);
  assert.match(html,/\.product h2\{font-size:24px/);
  assert.match(html,/@media\(max-width:680px\)[\s\S]*h1\{max-width:none;font-size:clamp\(34px,11vw,46px\)/);
  assert.doesNotMatch(html,/h1\{font-size:clamp\(42px,7vw,84px\)/);
});

test('service-priced modules remain fixed across endpoint tiers',()=>{
  for(const [id,price] of [
    ['qupay',149],
    ['quhub',399],
    ['quidentify',299],
    ['aggy',599],
    ['quoptio',399]
  ]){
    const productLine=html.split(/\r?\n/).find(line=>line.includes(`{id:'${id}'`));
    const fixed=`prices:{'10':${price},'25':${price},'50':${price},'100':${price},'250':${price},'500':${price},'1000':${price}}`;
    assert.ok(productLine,`${id} must remain in the catalog`);
    assert.ok(productLine.includes(fixed),`${id} must not scale with the endpoint tier`);
  }
  assert.match(html,/p\.unit==='flat'\?p\.prices\['10'\]:undefined/);
  assert.match(html,/function requiresEndpointConsult\(items\)\{return isConsult\(\)&&items\.some\(p=>p\.unit==='endpoint'\)\}/);
  assert.match(html,/if\(requiresEndpointConsult\(order\.items\)\|\|order\.requiresGovernedQuote\)/);
});
