import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const release=JSON.parse(await readFile(new URL('../aggy-release.json',import.meta.url),'utf8'));
const rollout=JSON.parse(await readFile(new URL('../aggy-rollout-targets.json',import.meta.url),'utf8'));

test('Aggy release candidate and rollout inventory stay synchronized',()=>{
  assert.equal(release.version,'1.0.0-rc.35');
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
  const surfaces=Object.fromEntries(rollout.webSurfaces.map(surface=>[surface.name,surface]));
  assert.match(surfaces['SECQUOIA Marketplace and corporate site'].integration,/loader/);
  assert.match(surfaces['SECQUOIA Strategic Holdings'].integration,/loader/);
  assert.match(surfaces.QnQ.integration,/loader/);
  assert.equal(surfaces.QuChat.lifecycle,'legacy-compatibility-alias');
  assert.equal(surfaces.QuChat.integration,'permanent-redirect-to-canonical-aggy');
  assert.match(surfaces.QuChat.canonicalDestination,/[?&]aggy=chat/);
  assert.equal(surfaces['QuSpace / QuHub'].lifecycle,'active-enterprise-workspace');
  assert.equal(surfaces['QuSpace / QuHub'].integration,'aggy-contextual-copilot');
  assert.equal(surfaces['QuSpace / QuHub'].quhubRole,'independent-integration-and-llm-gateway');
});

test('RC status does not overclaim stable GA or third-party sale',()=>{
  assert.equal(release.productionApproved,false);
  assert.equal(release.thirdPartySale,false);
  assert.equal(rollout.promotion.productionApproved,false);
  assert.equal(rollout.promotion.thirdPartySale,false);
});
