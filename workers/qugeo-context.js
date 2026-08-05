const ALLOWED_ORIGINS = new Set([
  'https://secquoia.net',
  'https://www.secquoia.net'
]);

const LANGUAGE_BY_COUNTRY = Object.freeze({
  AR: 'es', BO: 'es', CL: 'es', CO: 'es', CR: 'es', CU: 'es', DO: 'es',
  EC: 'es', ES: 'es', GT: 'es', HN: 'es', MX: 'es', NI: 'es', PA: 'es',
  PE: 'es', PR: 'es', PY: 'es', SV: 'es', UY: 'es', VE: 'es',
  BR: 'pt', PT: 'pt',
  FR: 'fr', BE: 'fr', CH: 'de', DE: 'de', AT: 'de', IT: 'it',
  JP: 'ja', CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', RU: 'ru', IN: 'hi',
  SA: 'ar', AE: 'ar', BH: 'ar', DZ: 'ar', EG: 'ar', IQ: 'ar', JO: 'ar',
  KW: 'ar', LB: 'ar', LY: 'ar', MA: 'ar', OM: 'ar', PS: 'ar', QA: 'ar',
  SD: 'ar', SO: 'ar', SY: 'ar', TN: 'ar', YE: 'ar',
  CA: 'en', GB: 'en', IE: 'en', AU: 'en', NZ: 'en', US: 'en'
});

const LOCALE_BY_LANGUAGE = Object.freeze({
  es: 'es-CO',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ru: 'ru-RU',
  ar: 'ar-SA',
  hi: 'hi-IN'
});

const MAX_UPSTREAM_BYTES = 128 * 1024;
const WORLD_BANK_BASE = 'https://api.worldbank.org/v2';
const WORLD_BANK_POPULATION_SNAPSHOT = Object.freeze({
  AR: [45851378, '2025'], AU: [27614411, '2025'], AT: [9208163, '2025'],
  BE: [11941781, '2025'], BO: [12581843, '2025'], BR: [212812405, '2025'],
  CA: [41651653, '2025'], CH: [9092436, '2025'], CL: [19859921, '2025'],
  CN: [1406585000, '2025'], CO: [53425635, '2025'], CR: [5152950, '2025'],
  CU: [10937203, '2025'], DE: [83491249, '2025'], DO: [11520487, '2025'],
  EC: [18289896, '2025'], ES: [49355143, '2025'], FR: [68720337, '2025'],
  GB: [69487000, '2025'], GT: [18687881, '2025'], HN: [11005850, '2025'],
  IN: [1463865525, '2025'], IE: [5484367, '2025'], IT: [58915656, '2025'],
  JP: [123366734, '2025'], MX: [131946900, '2025'], NI: [7007502, '2025'],
  NZ: [5324700, '2025'], PA: [4571189, '2025'], PE: [34576665, '2025'],
  PT: [10804871, '2025'], PY: [7013078, '2025'], SV: [6365503, '2025'],
  UY: [3384688, '2025'], US: [341784857, '2025'], VE: [28516896, '2025']
});

const corsHeaders = request => {
  const origin = request.headers.get('Origin');
  return origin && ALLOWED_ORIGINS.has(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin'
      }
    : {};
};

const json = (request, body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...corsHeaders(request)
  }
});

const clean = (value, max = 120) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

const finiteNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const approximateCoordinate = value => {
  const number = finiteNumber(value);
  return number === null ? null : Math.round(number * 100) / 100;
};

const validTimezone = value => {
  const timezone = clean(value, 80) || 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
    return timezone;
  } catch {
    return 'UTC';
  }
};

const browserLanguage = request => {
  const accepted = (request.headers.get('Accept-Language') || '').toLowerCase();
  return (accepted.match(/\b(es|en|fr|de|it|pt|ja|zh|ru|ar|hi)(?:-|;|,|$)/) || [])[1] || null;
};

const localizedCountryName = (countryCode, locale) => {
  if (!countryCode) return null;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
};

const formattedTime = (now, locale, timezone) => {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    dateStyle: 'full'
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    timeStyle: 'medium',
    hourCycle: 'h23'
  });
  const hourFormatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23'
  });
  const offsetFormatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  });
  const hour = Number(hourFormatter.formatToParts(now).find(part => part.type === 'hour')?.value || 12);
  const offset = offsetFormatter.formatToParts(now).find(part => part.type === 'timeZoneName')?.value || 'GMT';
  const greetingPeriod = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return {
    timezone,
    utc: now.toISOString(),
    localDate: dateFormatter.format(now),
    localTime: timeFormatter.format(now),
    utcOffset: offset,
    greetingPeriod
  };
};

const readBoundedJson = async response => {
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  const declared = Number(response.headers.get('Content-Length') || 0);
  if (declared > MAX_UPSTREAM_BYTES) throw new Error('upstream_response_too_large');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_UPSTREAM_BYTES) throw new Error('upstream_response_too_large');
  return JSON.parse(new TextDecoder().decode(buffer));
};

const worldBankFetch = async url => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(3500),
    cf: { cacheEverything: true, cacheTtl: 86400 }
  });
  return readBoundedJson(response);
};

const countryEnrichment = async countryCode => {
  if (!/^[A-Z]{2}$/.test(countryCode || '')) return { status: 'unavailable' };
  const countryUrl = `${WORLD_BANK_BASE}/country/${countryCode}?format=json`;
  const populationUrl = `${WORLD_BANK_BASE}/country/${countryCode}/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=1`;
  const [countryResult, populationResult] = await Promise.allSettled([
    worldBankFetch(countryUrl),
    worldBankFetch(populationUrl)
  ]);
  const country = countryResult.status === 'fulfilled' && Array.isArray(countryResult.value?.[1])
    ? countryResult.value[1][0]
    : null;
  const populationRecord = populationResult.status === 'fulfilled' && Array.isArray(populationResult.value?.[1])
    ? populationResult.value[1][0]
    : null;
  const livePopulation = finiteNumber(populationRecord?.value);
  const populationFallback = WORLD_BANK_POPULATION_SNAPSHOT[countryCode] || null;
  const population = livePopulation ?? populationFallback?.[0] ?? null;
  const populationYear = clean(populationRecord?.date, 8) || populationFallback?.[1] || null;
  return {
    status: country || population ? (country && population ? 'complete' : 'partial') : 'unavailable',
    name: clean(country?.name),
    capital: clean(country?.capitalCity),
    region: clean(country?.region?.value),
    incomeLevel: clean(country?.incomeLevel?.value),
    population,
    populationYear,
    populationSource: livePopulation === null && populationFallback ? 'world_bank_2025_snapshot' : livePopulation === null ? null : 'world_bank_api'
  };
};

const contextFromRequest = async request => {
  const cf = request.cf || {};
  const countryCode = clean(cf.country, 2)?.toUpperCase() || null;
  const language = LANGUAGE_BY_COUNTRY[countryCode] || browserLanguage(request) || 'en';
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-US';
  const timezone = validTimezone(cf.timezone);
  const now = new Date();
  const enrichment = await countryEnrichment(countryCode);
  const countryName = enrichment.name || localizedCountryName(countryCode, locale);

  return {
    schema: 'secquoia.qugeo.context.v1',
    generatedAt: now.toISOString(),
    location: {
      countryCode,
      countryName,
      continent: clean(cf.continent, 2),
      region: clean(cf.region),
      regionCode: clean(cf.regionCode, 12),
      city: clean(cf.city),
      coordinates: {
        latitude: approximateCoordinate(cf.latitude),
        longitude: approximateCoordinate(cf.longitude),
        decimals: 2,
        approximate: true
      },
      confidence: 'NETWORK_DERIVED_APPROXIMATION',
      physicalAttribution: false
    },
    time: formattedTime(now, locale, timezone),
    language: {
      code: language,
      locale,
      source: LANGUAGE_BY_COUNTRY[countryCode] ? 'country_default' : browserLanguage(request) ? 'accept_language' : 'fallback'
    },
    country: {
      status: enrichment.status,
      capital: enrichment.capital,
      region: enrichment.region,
      incomeLevel: enrichment.incomeLevel,
      population: enrichment.population,
      populationYear: enrichment.populationYear,
      populationSource: enrichment.populationSource
    },
    conversation: {
      useWhenRelevant: ['language', 'local_time', 'country', 'city', 'date_and_number_conventions'],
      culturalContext: {
        status: 'USER_CONFIRMATION_REQUIRED',
        guidance: 'Use neutral local context and ask before applying culturally specific assumptions.',
        prohibitedInferences: ['religion', 'ethnicity', 'politics', 'individual_customs', 'precise_physical_location']
      }
    },
    privacy: {
      ipReturned: false,
      ipStored: false,
      exactLocationReturned: false,
      persistence: 'none_by_qugeo_worker',
      notice: 'Location is approximate network context, not proof of a person or physical address.'
    },
    sources: [
      {
        provider: 'Cloudflare',
        purpose: 'network-derived geographic request metadata',
        url: 'https://developers.cloudflare.com/workers/runtime-apis/request/'
      },
      {
        provider: 'World Bank',
        purpose: 'country metadata and latest available population indicator SP.POP.TOTL',
        url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures'
      }
    ]
  };
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (request.method !== 'GET') return json(request, { error: 'method_not_allowed' }, 405);
    if (url.pathname === '/health') {
      return json(request, {
        service: 'QuGEO',
        status: 'ready',
        schema: 'secquoia.qugeo.context.v1',
        privacy: 'ip_not_returned_or_stored'
      });
    }
    if (url.pathname !== '/' && url.pathname !== '/v1/context') {
      return json(request, { error: 'not_found' }, 404);
    }
    return json(request, await contextFromRequest(request));
  }
};

export {
  ALLOWED_ORIGINS,
  contextFromRequest,
  countryEnrichment,
  formattedTime
};
