import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../workers/qugeo-context.js';

const originalFetch = globalThis.fetch;

const withCf = (request, cf) => {
  Object.defineProperty(request, 'cf', { value: cf });
  return request;
};

const worldBankMock = async url => {
  const href = String(url);
  if (href.includes('/indicator/SP.POP.TOTL')) {
    return new Response(JSON.stringify([{}, [{
      country: { value: 'Colombia' },
      countryiso3code: 'COL',
      date: '2024',
      value: 52886363
    }]]), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify([{}, [{
    name: 'Colombia',
    capitalCity: 'Bogota',
    region: { value: 'Latin America & Caribbean' },
    incomeLevel: { value: 'Upper middle income' }
  }]]), { headers: { 'Content-Type': 'application/json' } });
};

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('returns privacy-preserving Colombian context with bounded coordinates', async () => {
  globalThis.fetch = worldBankMock;
  const request = withCf(new Request('https://qugeo.secquoia.group/v1/context', {
    headers: {
      Origin: 'https://secquoia.net',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }), {
    country: 'CO',
    continent: 'SA',
    city: 'Bogota',
    region: 'Bogota D.C.',
    regionCode: 'DC',
    latitude: '4.7110',
    longitude: '-74.0721',
    timezone: 'America/Bogota'
  });

  const response = await worker.fetch(request);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://secquoia.net');
  assert.equal(body.schema, 'secquoia.qugeo.context.v1');
  assert.equal(body.language.code, 'es');
  assert.equal(body.language.locale, 'es-CO');
  assert.equal(body.location.coordinates.latitude, 4.71);
  assert.equal(body.location.coordinates.longitude, -74.07);
  assert.equal(body.location.physicalAttribution, false);
  assert.equal(body.country.population, 52886363);
  assert.equal(body.country.populationYear, '2024');
  assert.equal(body.privacy.ipReturned, false);
  assert.equal(JSON.stringify(body).includes('203.0.113.10'), false);
});

test('degrades safely when edge and country enrichment are unavailable', async () => {
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  const request = new Request('https://qugeo.secquoia.group/v1/context', {
    headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const response = await worker.fetch(request);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.location.countryCode, null);
  assert.equal(body.language.code, 'fr');
  assert.equal(body.time.timezone, 'UTC');
  assert.equal(body.country.status, 'unavailable');
});

test('detects the five additional Voice LIVE languages from browser preferences', async () => {
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  const cases = [
    ['ja-JP,ja;q=0.9', 'ja', 'ja-JP'],
    ['zh-CN,zh;q=0.9', 'zh', 'zh-CN'],
    ['ru-RU,ru;q=0.9', 'ru', 'ru-RU'],
    ['ar-SA,ar;q=0.9', 'ar', 'ar-SA'],
    ['hi-IN,hi;q=0.9', 'hi', 'hi-IN']
  ];
  for (const [accepted, code, locale] of cases) {
    const response = await worker.fetch(new Request('https://qugeo.secquoia.group/v1/context', {
      headers: { 'Accept-Language': accepted }
    }));
    const body = await response.json();
    assert.equal(body.language.code, code);
    assert.equal(body.language.locale, locale);
  }
});

test('uses the dated World Bank snapshot when the live population endpoint times out', async () => {
  globalThis.fetch = async url => {
    if (String(url).includes('/indicator/SP.POP.TOTL')) throw new DOMException('timeout', 'TimeoutError');
    return worldBankMock(url);
  };
  const request = withCf(new Request('https://qugeo.secquoia.group/v1/context'), {
    country: 'CO',
    timezone: 'America/Bogota'
  });
  const response = await worker.fetch(request);
  const body = await response.json();
  assert.equal(body.country.status, 'complete');
  assert.equal(body.country.population, 53425635);
  assert.equal(body.country.populationYear, '2025');
  assert.equal(body.country.populationSource, 'world_bank_2025_snapshot');
});

test('does not grant browser CORS to unknown origins', async () => {
  globalThis.fetch = worldBankMock;
  const request = withCf(new Request('https://qugeo.secquoia.group/health', {
    headers: { Origin: 'https://attacker.example' }
  }), { country: 'CO' });
  const response = await worker.fetch(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.has('Access-Control-Allow-Origin'), false);
});

test('rejects unsupported methods and paths', async () => {
  const post = await worker.fetch(new Request('https://qugeo.secquoia.group/v1/context', { method: 'POST' }));
  const missing = await worker.fetch(new Request('https://qugeo.secquoia.group/private'));
  assert.equal(post.status, 405);
  assert.equal(missing.status, 404);
});
