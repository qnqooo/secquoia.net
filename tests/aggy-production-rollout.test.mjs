import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const release=JSON.parse(await readFile(new URL('../aggy-release.json',import.meta.url),'utf8'));
const rollout=JSON.parse(await readFile(new URL('../aggy-rollout-targets.json',import.meta.url),'utf8'));

test('Aggy release candidate and rollout inventory stay synchronized',()=>{
  assert.equal(release.version,'1.0.0-rc.6');
  assert.equal(release.channel,'rc');
  assert.equal(release.lifecycle,'production-validation');
  assert.equal(rollout.release,release.version);
  assert.equal(rollout.webSurfaces.length,5);
});

test('All known ecosystem web surfaces have an Aggy integration contract',()=>{
  const expected=new Set([
    'https://secquoia.net/',
    'https://secquoia.group/',
    'https://qnq.ooo/',
    'https://qu-chat.m2m-telecom-7238.chatgpt.site/',
    'https://quhub-financial-intelligence.m2m-telecom-7238.chatgpt.site/'
  ]);
  assert.deepEqual(new Set(rollout.webSurfaces.map(surface=>surface.url)),expected);
  assert.ok(rollout.webSurfaces.every(surface=>surface.integration.includes('loader')));
});

test('RC status does not overclaim stable GA or third-party sale',()=>{
  assert.equal(release.productionApproved,false);
  assert.equal(release.thirdPartySale,false);
  assert.equal(rollout.promotion.productionApproved,false);
  assert.equal(rollout.promotion.thirdPartySale,false);
});
