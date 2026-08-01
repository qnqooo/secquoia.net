import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');

test('QuOptio presents one universal four-step purchase journey',()=>{
  for(const step of ['selection','identity','payment','activation'])assert.match(html,new RegExp(`data-purchase-step="${step}"`));
  assert.match(html,/function quoptioPurchaseDecision\(\)/);
  assert.match(html,/mode:items\.length===0\?'EMPTY':instant\?'INSTANT':assisted\?'ASSISTED':'GOVERNED'/);
  assert.match(html,/Continue with QuIdentify/);
  assert.match(html,/Pay securely with QuPay/);
  assert.match(html,/Validate and continue/);
});

test('QuOptio adds declared dependencies without duplicated selection',()=>{
  assert.match(html,/qusoc:\['qufense'\]/);
  assert.match(html,/aggy:\['quhub'\]/);
  assert.match(html,/quoptio:\['qucfa'\]/);
  assert.match(html,/if\(selected\.has\(dependencyId\)\)continue/);
  assert.match(html,/no se duplican cargos/);
});

test('Marketplace preserves the governed cart through QuIdentify',()=>{
  assert.match(html,/secquoia\.qumarket\.purchase-intent\.v1/);
  assert.match(html,/expiresAt:Date\.now\(\)\+30\*60\*1000/);
  assert.match(html,/marketplaceIdentityReturnUrl\(orderRef\),'marketplace_checkout'/);
  assert.match(html,/url\.searchParams\.set\('checkout','marketplace'\)/);
  assert.match(html,/params\.get\('checkout'\)==='marketplace'&&restorePurchaseIntent\(\)/);
  assert.match(html,/Tu solución quedó guardada/);
});

test('Catalog compiles decision information into selectable cards',()=>{
  assert.match(html,/class="product-scope"/);
  assert.match(html,/Alcance y requisitos/);
  assert.match(html,/Included ✓/);
  assert.match(html,/product\.selected/);
  assert.match(html,/QuOptio mantiene/);
  assert.doesNotMatch(html,/class="availability-copy">'\+availability\.summary/);
});

test('Cart hides zero-value noise and states the payment boundary honestly',()=>{
  assert.match(html,/servicesRow'\)\.hidden=!oneTimeServices/);
  assert.match(html,/discountRow'\)\.hidden=!\(discount>0\)/);
  assert.match(html,/QuCFA validates pricing/);
  assert.match(html,/Card data is handled by Stripe/);
  assert.match(html,/sin cobros prematuros/);
});

test('Marketplace prioritizes equal-size QuSOC, QuFense, QuHub and QuIdentify cards',()=>{
  assert.match(html,/products:\['qusoc','qufense','quhub','quidentify'\]/);
  assert.match(html,/\.product-group \.cards\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\);grid-auto-rows:1fr\}/);
  assert.match(html,/\.product,\.product\.featured\{grid-column:auto;min-height:326px;height:100%\}/);
  assert.match(html,/href="https:\/\/qusoc\.secquoia\.group\/admin"/);
  assert.match(html,/aria-label="QuSOC COMMAND 360°"/);
  assert.match(html,/!e\.target\.closest\('button,a'\)/);
});
