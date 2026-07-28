import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sources=await Promise.all([
  '../index.html',
  '../qu-market.html',
  '../aggy-marketplace.js',
  '../aggy-marketplace.css',
  '../aggy-realtime-voice.js',
  '../qumarket-addons.js',
  '../docs/AGGY_NAMING_STANDARD.md',
  '../docs/aggy-marketplace-advanced-integration.md',
  '../docs/qumarket-human-services-rate-card.md',
  '../docs/qumarket-self-service-deployment-protocol.md'
].map(path=>readFile(new URL(path,import.meta.url),'utf8')));

test('Aggy is the sole active product name across app and documentation',()=>{
  const corpus=sources.join('\n');
  assert.doesNotMatch(corpus,/\bagent\x79\b/i);
  assert.match(corpus,/\bAggy\b/);
  assert.match(corpus,/AGGY_SERVICE_MONTH/);
  assert.match(corpus,/id:'aggy',name:'Aggy/);
});

test('Aggy assets and UI identifiers use the current namespace',()=>{
  const [index,market,bridge,css]=sources;
  assert.match(market,/href="aggy-marketplace\.css(?:\?[^"]+)?"/);
  assert.match(market,/src="aggy-marketplace\.js(?:\?[^"]+)?"/);
  assert.match(market,/aria-label="Centro de comunicaciones de Aggy"/);
  assert.match(bridge,/dataset\.openAggyPanel/);
  assert.match(css,/\.assistant\.aggy-full/);
  assert.match(index,/aggy:'aggy',quchat:'aggy',quvoice:'aggy',quagent:'aggy'/);
});
