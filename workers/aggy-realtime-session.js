const DEFAULT_REALTIME_MODEL='gpt-realtime-2.1';
const DEFAULT_REALTIME_VOICE='marin';
const QVIT_PER_USD=1_000_000;
const TARGET_MARGIN_BPS=3500;
const AGGY_FREE_MS=5*60*1000;
const AGGY_PAID_BLOCK_MS=60*1000;
const AGGY_MAX_PAID_BLOCKS_DAY=15;
const AGGY_MAX_PAID_BLOCKS_MONTH=150;
const AGGY_PENDING_LEASE_MS=30*1000;
const AGGY_PROVIDER_RESERVE_USD=.15;
const AGGY_QUOPTIO_STOP_RATIO=.9;
const AGGY_RATE_CARD=Object.freeze({
  provider:'openai',
  model:'gpt-realtime-2.1',
  version:'2026-07-26',
  sourceRef:'https://developers.openai.com/api/docs/models/gpt-realtime-2.1',
  rates:Object.freeze({
    inputTextTokens:4/1e6,
    cachedInputTokens:.4/1e6,
    inputAudioTokens:32/1e6,
    inputImageTokens:5/1e6,
    outputTextTokens:24/1e6,
    outputAudioTokens:64/1e6
  })
});
const roundUp=(value,step)=>Math.ceil(value/step)*step;
const rateCardIsCurrent=(now=Date.now())=>{
  const issuedAt=Date.parse(`${AGGY_RATE_CARD.version}T00:00:00.000Z`);
  return Number.isFinite(issuedAt)&&now>=issuedAt&&now-issuedAt<=AGGY_QUOPTIO_POLICY.rateCardMaxAgeDays*24*60*60*1000;
};
const AGGY_PAID_BLOCK_QVIT=roundUp(
  AGGY_PROVIDER_RESERVE_USD/(1-TARGET_MARGIN_BPS/10_000)*QVIT_PER_USD,
  10_000
);
const AGGY_QUOPTIO_POLICY=Object.freeze({
  schema:'secquoia.quoptio.aggy-pricing-policy.v1',
  version:'2026-07-26.1',
  mode:'PREPAID_ONE_MINUTE_MICROLEASE',
  freeSeconds:AGGY_FREE_MS/1000,
  paidLeaseSeconds:AGGY_PAID_BLOCK_MS/1000,
  latestApprovedRealtimeModelRequired:true,
  silentModelDowngradeAllowed:false,
  overdraftAllowed:false,
  reserveBeforeProviderAccess:true,
  providerCostStopRatio:AGGY_QUOPTIO_STOP_RATIO,
  dailyPaidMinutes:AGGY_MAX_PAID_BLOCKS_DAY,
  monthlyPaidMinutes:AGGY_MAX_PAID_BLOCKS_MONTH,
  rateCardMaxAgeDays:30,
  staleRateCardAction:'FAIL_CLOSED'
});
const AGGY_RELEASE=Object.freeze({
  version:'1.0.0-rc.17',
  channel:'rc',
  lifecycle:'production-validation',
  distribution:'ecosystem-hosted',
  productionApproved:false,
  thirdPartySale:false
});
const MAX_SDP_BYTES=64*1024;
const MAX_CHAT_TEXT_BYTES=4*1024;
const MAX_CHAT_BODY_BYTES=160*1024;
const ALLOWED_ORIGINS=new Set([
  'https://secquoia.net',
  'https://www.secquoia.net',
  'https://secquoia.group',
  'https://www.secquoia.group',
  'https://qu-market.secquoia.group',
  'https://qnq.ooo',
  'https://www.qnq.ooo',
  'https://qu-chat.m2m-telecom-7238.chatgpt.site',
  'https://quhub-financial-intelligence.m2m-telecom-7238.chatgpt.site'
]);
const LANGUAGE_BY_COUNTRY=Object.freeze({
  ES:'es',MX:'es',CO:'es',AR:'es',CL:'es',PE:'es',EC:'es',VE:'es',BO:'es',PY:'es',UY:'es',PA:'es',CR:'es',GT:'es',HN:'es',SV:'es',NI:'es',DO:'es',CU:'es',PR:'es',
  FR:'fr',BE:'fr',MC:'fr',LU:'fr',DE:'de',AT:'de',CH:'de',IT:'it',SM:'it',VA:'it',PT:'pt',BR:'pt'
});
const LOCALE_BY_LANGUAGE=Object.freeze({es:'es-CO',en:'en-US',fr:'fr-FR',de:'de-DE',it:'it-IT',pt:'pt-BR'});

const qugeo=request=>{
  const country=String(request.cf?.country||'').toUpperCase().slice(0,2);
  const accepted=(request.headers.get('Accept-Language')||'').toLowerCase();
  const browserLanguage=(accepted.match(/\b(es|en|fr|de|it|pt)(?:-|;|,|$)/)||[])[1];
  const language=LANGUAGE_BY_COUNTRY[country]||browserLanguage||'es';
  return Object.freeze({
    language,
    locale:LOCALE_BY_LANGUAGE[language],
    country:country||null,
    source:LANGUAGE_BY_COUNTRY[country]?'QU_GEO_EDGE_COUNTRY':browserLanguage?'BROWSER_LANGUAGE_FALLBACK':'DEFAULT_ES_CO',
    preciseLocationStored:false,
    ipStored:false
  });
};

const corsHeaders=request=>{
  const origin=request.headers.get('Origin');
  if(!ALLOWED_ORIGINS.has(origin))return {};
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Aggy-Lease, X-Aggy-Lease-Capability, X-QuPay-Signature',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin'
  };
};

const json=(body,status=400,request)=>new Response(JSON.stringify(body),{
  status,
  headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    ...corsHeaders(request)
  }
});

const sha256Hex=async value=>{
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
};
const sha256Base64Url=async value=>{
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  let binary='';
  digest.forEach(byte=>binary+=String.fromCharCode(byte));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
};
const randomCapability=()=>{
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  let binary='';
  bytes.forEach(byte=>binary+=String.fromCharCode(byte));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
};
const finiteToken=value=>{
  const number=Number(value);
  return Number.isFinite(number)&&number>0?Math.floor(number):0;
};
const normalizeRealtimeUsage=usage=>{
  const input=usage?.input_token_details||usage?.input_tokens_details||{};
  const output=usage?.output_token_details||usage?.output_tokens_details||{};
  const cached=input.cached_tokens_details||{};
  const cachedText=finiteToken(cached.text_tokens);
  const cachedAudio=finiteToken(cached.audio_tokens);
  const cachedImage=finiteToken(cached.image_tokens);
  return Object.freeze({
    inputTextTokens:Math.max(0,finiteToken(input.text_tokens)-cachedText),
    inputAudioTokens:Math.max(0,finiteToken(input.audio_tokens)-cachedAudio),
    inputImageTokens:Math.max(0,finiteToken(input.image_tokens)-cachedImage),
    cachedInputTokens:cachedText+cachedAudio+cachedImage||finiteToken(input.cached_tokens),
    outputTextTokens:finiteToken(output.text_tokens),
    outputAudioTokens:finiteToken(output.audio_tokens)
  });
};
const quoteRealtimeUsage=usage=>{
  const normalized=normalizeRealtimeUsage(usage);
  const components=[];
  let providerCostUsd=0;
  for(const [resource,quantity] of Object.entries(normalized)){
    if(!quantity)continue;
    const rate=AGGY_RATE_CARD.rates[resource];
    if(!Number.isFinite(rate))continue;
    const cost=quantity*rate;
    providerCostUsd+=cost;
    components.push({resource,quantity,providerUsdPerToken:rate,providerCostUsd:Number(cost.toFixed(8))});
  }
  const customerPriceUsd=providerCostUsd/(1-TARGET_MARGIN_BPS/10_000);
  return Object.freeze({
    schema:'secquoia.qucfa.aggy-realtime-usage.v1',
    status:components.length?'RECONCILED_USAGE':'NO_BILLABLE_USAGE',
    rateCard:{provider:AGGY_RATE_CARD.provider,model:AGGY_RATE_CARD.model,version:AGGY_RATE_CARD.version,sourceRef:AGGY_RATE_CARD.sourceRef},
    components,
    providerCostQcu:Math.round(providerCostUsd*1e6),
    providerCostUsd:Number(providerCostUsd.toFixed(8)),
    targetMarginBps:TARGET_MARGIN_BPS,
    customerPriceUsd:Number(customerPriceUsd.toFixed(6)),
    customerQVit:Math.ceil(customerPriceUsd*QVIT_PER_USD)
  });
};
const aggyBlockQuote=()=>Object.freeze({
  schema:'secquoia.qucfa.aggy-continuity-token.v1',
  status:'FIXED_PREPAID_MINUTE',
  unit:'AGGY_MINUTE',
  durationSeconds:AGGY_PAID_BLOCK_MS/1000,
  providerReserveUsd:AGGY_PROVIDER_RESERVE_USD,
  customerQVit:AGGY_PAID_BLOCK_QVIT,
  targetMarginBps:TARGET_MARGIN_BPS,
  overdraftAllowed:false,
  optimizer:{name:'QuOptio',policyVersion:AGGY_QUOPTIO_POLICY.version},
  rateCard:{provider:AGGY_RATE_CARD.provider,model:AGGY_RATE_CARD.model,version:AGGY_RATE_CARD.version,sourceRef:AGGY_RATE_CARD.sourceRef}
});
const usageSubject=async request=>{
  const edgeIp=request.headers.get('CF-Connecting-IP')||'local';
  const userAgent=(request.headers.get('User-Agent')||'unknown').slice(0,300);
  const accepted=(request.headers.get('Accept-Language')||'').slice(0,120);
  return sha256Base64Url(`aggy-meter-v1|${edgeIp}|${userAgent}|${accepted}`);
};
const safeJson=async request=>{
  const declared=Number(request.headers.get('Content-Length')||0);
  if(declared>MAX_CHAT_BODY_BYTES)throw new Error('body_too_large');
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_CHAT_BODY_BYTES)throw new Error('body_too_large');
  try{return JSON.parse(raw)}catch{throw new Error('invalid_json')}
};
const validToken=value=>/^[A-Za-z0-9_-]{32,128}$/.test(String(value||''));
const validRoomId=value=>/^[A-Za-z0-9_-]{43}$/.test(String(value||''));
const sanitizeChatText=raw=>{
  const original=String(raw??'');
  if(!original.trim())throw new Error('empty_text');
  if(new TextEncoder().encode(original).byteLength>MAX_CHAT_TEXT_BYTES)throw new Error('text_too_large');
  const normalized=original.normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g,'')
    .replace(/\r\n?/g,'\n')
    .trim();
  if(!normalized)throw new Error('empty_after_normalization');
  return normalized;
};
const validatePublicBundle=bundle=>{
  if(bundle?.schema!=='secquoia.aggy.device-public-bundle.v1')return false;
  if(bundle?.cryptoProfile!=='E2EE/PQC')return false;
  if(!/^[0-9a-f-]{36}$/i.test(String(bundle.deviceId||'')))return false;
  return validToken(bundle.fingerprint)&&
    typeof bundle.kemPublicKey==='string'&&bundle.kemPublicKey.length<3000&&
    typeof bundle.signaturePublicKey==='string'&&bundle.signaturePublicKey.length<5000&&
    bundle.algorithms?.kem==='ML-KEM-768+X25519'&&bundle.algorithms?.signature==='ML-DSA-65';
};
const validateEnvelope=envelope=>{
  const raw=JSON.stringify(envelope||{});
  return raw.length<MAX_CHAT_BODY_BYTES&&
    envelope?.header?.schema==='secquoia.aggy.quvault-e2ee-pqc.v1'&&
    envelope?.header?.cryptoProfile==='E2EE/PQC'&&
    envelope?.admissionReceipt?.schema==='secquoia.qusoc.chat-text-admission.v1'&&
    envelope?.admissionReceipt?.admissionAuthorized===true&&
    envelope?.admissionReceipt?.quvaultAuthorized===true&&
    typeof envelope.ciphertext==='string'&&
    typeof envelope.signature==='string'&&
    !Object.hasOwn(envelope,'text')&&!Object.hasOwn(envelope,'plaintext')&&!Object.hasOwn(envelope,'message');
};
const roomResponse=async(response,request)=>{
  const headers=new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([key,value])=>headers.set(key,value));
  headers.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};

class AggyChatRoom {
  constructor(ctx){
    this.ctx=ctx;
    this.sql=ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS room_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS bundles (
        device_id TEXT PRIMARY KEY,
        fingerprint TEXT NOT NULL UNIQUE,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT NOT NULL UNIQUE,
        recipient_device_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS messages_recipient_sequence
      ON messages(recipient_device_id, sequence);
    `);
  }
  reply(body,status=200){
    return new Response(JSON.stringify(body),{
      status,
      headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
    });
  }
  async authorized(request){
    const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
    if(!validToken(token))return false;
    const hash=await sha256Hex(token);
    const row=[...this.sql.exec('SELECT value FROM room_config WHERE key = ?', 'capability_hash')][0];
    if(!row){
      this.sql.exec('INSERT INTO room_config (key,value) VALUES (?,?)','capability_hash',hash);
      return true;
    }
    if(row.value.length!==hash.length)return false;
    let mismatch=0;
    for(let i=0;i<hash.length;i++)mismatch|=row.value.charCodeAt(i)^hash.charCodeAt(i);
    return mismatch===0;
  }
  async fetch(request){
    if(!await this.authorized(request))return this.reply({error:'invalid_room_capability'},401);
    const url=new URL(request.url);
    if(url.pathname==='/bundles'&&request.method==='GET'){
      const bundles=[...this.sql.exec('SELECT payload FROM bundles ORDER BY updated_at')].map(row=>JSON.parse(row.payload));
      return this.reply({schema:'secquoia.aggy.room-bundles.v1',bundles});
    }
    if(url.pathname==='/bundles'&&request.method==='PUT'){
      let body;
      try{body=await safeJson(request)}catch(error){return this.reply({error:error.message},400)}
      if(!validatePublicBundle(body.bundle))return this.reply({error:'invalid_public_bundle'},400);
      const now=new Date().toISOString();
      this.sql.exec(
        'INSERT INTO bundles (device_id,fingerprint,payload,updated_at) VALUES (?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET fingerprint=excluded.fingerprint,payload=excluded.payload,updated_at=excluded.updated_at',
        body.bundle.deviceId,body.bundle.fingerprint,JSON.stringify(body.bundle),now
      );
      return this.reply({stored:true,scope:'PUBLIC_KEY_ONLY',deviceId:body.bundle.deviceId},201);
    }
    if(url.pathname==='/messages'&&request.method==='POST'){
      let body;
      try{body=await safeJson(request)}catch(error){return this.reply({error:error.message},400)}
      if(!validateEnvelope(body.envelope))return this.reply({error:'invalid_or_plaintext_envelope'},400);
      const {header}=body.envelope;
      const known=[...this.sql.exec('SELECT device_id FROM bundles WHERE device_id = ?',header.recipientDeviceId)][0];
      if(!known)return this.reply({error:'recipient_bundle_not_registered'},409);
      try{
        this.sql.exec(
          'INSERT INTO messages (record_id,recipient_device_id,payload,created_at) VALUES (?,?,?,?)',
          header.recordId,header.recipientDeviceId,JSON.stringify(body.envelope),header.createdAt
        );
      }catch{return this.reply({error:'duplicate_or_invalid_record'},409)}
      return this.reply({stored:true,sequence:Number(this.sql.exec('SELECT last_insert_rowid() AS id').one().id),vault:'CIPHERTEXT_ONLY'},201);
    }
    if(url.pathname==='/messages'&&request.method==='GET'){
      const deviceId=String(url.searchParams.get('deviceId')||'');
      const after=Math.max(0,Number(url.searchParams.get('after')||0)||0);
      if(!/^[0-9a-f-]{36}$/i.test(deviceId))return this.reply({error:'invalid_device_id'},400);
      const messages=[...this.sql.exec(
        'SELECT sequence,payload FROM messages WHERE recipient_device_id = ? AND sequence > ? ORDER BY sequence LIMIT 50',
        deviceId,after
      )].map(row=>({sequence:Number(row.sequence),envelope:JSON.parse(row.payload)}));
      return this.reply({schema:'secquoia.aggy.quvault-ciphertext-page.v1',messages});
    }
    return this.reply({error:'not_found'},404);
  }
}

class AggyUsageMeter {
  constructor(ctx){
    this.ctx=ctx;
    this.sql=ctx.storage.sql;
    this.ctx.blockConcurrencyWhile(async()=>{
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS account (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          qvit_balance INTEGER NOT NULL DEFAULT 0,
          free_used_ms INTEGER NOT NULL DEFAULT 0,
          day_key TEXT NOT NULL DEFAULT '',
          month_key TEXT NOT NULL DEFAULT '',
          paid_blocks_day INTEGER NOT NULL DEFAULT 0,
          paid_blocks_month INTEGER NOT NULL DEFAULT 0,
          qvit_debit_day INTEGER NOT NULL DEFAULT 0,
          qvit_debit_month INTEGER NOT NULL DEFAULT 0
        );
        INSERT OR IGNORE INTO account (id) VALUES (1);
        CREATE TABLE IF NOT EXISTS leases (
          lease_id TEXT PRIMARY KEY,
          capability_hash TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('FREE','PAID')),
          status TEXT NOT NULL,
          duration_ms INTEGER NOT NULL,
          reserved_qvit INTEGER NOT NULL,
          created_at_ms INTEGER NOT NULL,
          started_at_ms INTEGER,
          expires_at_ms INTEGER NOT NULL,
          provider_established INTEGER NOT NULL DEFAULT 0,
          provider_call_id TEXT,
          ended_at_ms INTEGER,
          end_reason TEXT
        );
        CREATE INDEX IF NOT EXISTS leases_status_expiry ON leases(status,expires_at_ms);
        CREATE TABLE IF NOT EXISTS usage_receipts (
          response_id TEXT PRIMARY KEY,
          lease_id TEXT NOT NULL,
          usage_json TEXT NOT NULL,
          quote_json TEXT NOT NULL,
          provider_cost_qcu INTEGER NOT NULL,
          created_at_ms INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS usage_lease ON usage_receipts(lease_id);
        CREATE TABLE IF NOT EXISTS ledger (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          qvit_delta INTEGER NOT NULL,
          qvit_balance_after INTEGER NOT NULL,
          payload TEXT NOT NULL,
          created_at_ms INTEGER NOT NULL
        );
      `);
    });
  }
  reply(body,status=200){
    return new Response(JSON.stringify(body),{
      status,
      headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
    });
  }
  body(request){
    return request.json().catch(()=>({}));
  }
  account(){
    return this.sql.exec('SELECT * FROM account WHERE id = 1').one();
  }
  rollover(now){
    const date=new Date(now);
    const day=date.toISOString().slice(0,10);
    const month=day.slice(0,7);
    const account=this.account();
    if(account.day_key!==day){
      this.sql.exec('UPDATE account SET day_key = ?, paid_blocks_day = 0, qvit_debit_day = 0 WHERE id = 1',day);
    }
    if(account.month_key!==month){
      this.sql.exec('UPDATE account SET month_key = ?, paid_blocks_month = 0, qvit_debit_month = 0 WHERE id = 1',month);
    }
  }
  validCapability(row,capabilityHash){
    if(!row||!validToken(capabilityHash)||row.capability_hash.length!==capabilityHash.length)return false;
    let mismatch=0;
    for(let i=0;i<capabilityHash.length;i++)mismatch|=row.capability_hash.charCodeAt(i)^capabilityHash.charCodeAt(i);
    return mismatch===0;
  }
  activeLease(){
    return [...this.sql.exec("SELECT * FROM leases WHERE status IN ('PENDING','ACTIVE') ORDER BY created_at_ms DESC LIMIT 1")][0]||null;
  }
  ledger(eventId,eventType,qvitDelta,payload,now){
    const balance=Number(this.account().qvit_balance);
    this.sql.exec(
      'INSERT INTO ledger (event_id,event_type,qvit_delta,qvit_balance_after,payload,created_at_ms) VALUES (?,?,?,?,?,?)',
      eventId,eventType,qvitDelta,balance,JSON.stringify(payload||{}),now
    );
  }
  closeExpired(now){
    const leases=[...this.sql.exec("SELECT * FROM leases WHERE status IN ('PENDING','ACTIVE') AND expires_at_ms <= ?",now)];
    for(const lease of leases){
      if(lease.status==='PENDING'){
        if(lease.kind==='PAID'&&lease.reserved_qvit>0){
          this.sql.exec(
            'UPDATE account SET qvit_balance = qvit_balance + ?, paid_blocks_day = MAX(0,paid_blocks_day - 1), paid_blocks_month = MAX(0,paid_blocks_month - 1), qvit_debit_day = MAX(0,qvit_debit_day - ?), qvit_debit_month = MAX(0,qvit_debit_month - ?) WHERE id = 1',
            lease.reserved_qvit,lease.reserved_qvit,lease.reserved_qvit
          );
          this.ledger(`refund:${lease.lease_id}`,'QUPAY_QVIT_RESERVATION_REFUND',lease.reserved_qvit,{reason:'pending_lease_expired'},now);
        }
        this.sql.exec("UPDATE leases SET status='EXPIRED',ended_at_ms=?,end_reason='PENDING_TIMEOUT' WHERE lease_id=?",now,lease.lease_id);
        continue;
      }
      if(lease.kind==='FREE'){
        this.sql.exec('UPDATE account SET free_used_ms = MIN(?, free_used_ms + ?) WHERE id = 1',AGGY_FREE_MS,lease.duration_ms);
      }
      this.sql.exec("UPDATE leases SET status='EXPIRED',ended_at_ms=?,end_reason='TIME_LIMIT' WHERE lease_id=?",now,lease.lease_id);
      this.ledger(`settle:${lease.lease_id}`,'QUCFA_QVIT_LEASE_SETTLED',0,{kind:lease.kind,reason:'TIME_LIMIT',chargedQVit:lease.reserved_qvit},now);
    }
  }
  status(now=Date.now()){
    this.rollover(now);
    this.closeExpired(now);
    const account=this.account();
    const lease=this.activeLease();
    const freeRemainingMs=Math.max(0,AGGY_FREE_MS-Number(account.free_used_ms));
    return {
      schema:'secquoia.aggy.usage-status.v1',
      status:lease?'LEASE_ACTIVE':freeRemainingMs?'FREE_AVAILABLE':Number(account.qvit_balance)>=AGGY_PAID_BLOCK_QVIT?'PAID_AVAILABLE':'TOP_UP_REQUIRED',
      free:{limitSeconds:AGGY_FREE_MS/1000,usedSeconds:Math.ceil(Number(account.free_used_ms)/1000),remainingSeconds:Math.floor(freeRemainingMs/1000),lifetimeAllowance:true},
      wallet:{currency:'QVIT',balance:Number(account.qvit_balance),overdraftAllowed:false},
      continuation:aggyBlockQuote(),
      limits:{
        paidBlocksDay:{used:Number(account.paid_blocks_day),max:AGGY_MAX_PAID_BLOCKS_DAY},
        paidBlocksMonth:{used:Number(account.paid_blocks_month),max:AGGY_MAX_PAID_BLOCKS_MONTH},
        paidMinutesDayMax:AGGY_MAX_PAID_BLOCKS_DAY*AGGY_PAID_BLOCK_MS/60000,
        paidMinutesMonthMax:AGGY_MAX_PAID_BLOCKS_MONTH*AGGY_PAID_BLOCK_MS/60000
      },
      activeLease:lease?{leaseId:lease.lease_id,kind:lease.kind,status:lease.status,expiresAt:new Date(Number(lease.expires_at_ms)).toISOString()}:null,
      engines:['QuCFA','QVit','QuPay','QuIdentify','QuFense','QuAudit'],
      audit:'SERVER_SIDE_SQLITE_LEDGER'
    };
  }
  async openLease(body,now){
    this.rollover(now);
    this.closeExpired(now);
    if(this.activeLease())return this.reply({error:'active_lease_exists',...this.status(now)},409);
    const account=this.account();
    const freeRemaining=Math.max(0,AGGY_FREE_MS-Number(account.free_used_ms));
    let kind='FREE';
    let duration=freeRemaining;
    let reserved=0;
    if(duration<=0){
      kind='PAID';
      duration=AGGY_PAID_BLOCK_MS;
      reserved=AGGY_PAID_BLOCK_QVIT;
      if(Number(account.paid_blocks_day)>=AGGY_MAX_PAID_BLOCKS_DAY)return this.reply({error:'daily_limit_reached',...this.status(now)},429);
      if(Number(account.paid_blocks_month)>=AGGY_MAX_PAID_BLOCKS_MONTH)return this.reply({error:'monthly_limit_reached',...this.status(now)},429);
      if(Number(account.qvit_balance)<reserved)return this.reply({error:'insufficient_qvit',...this.status(now)},402);
      this.sql.exec(
        'UPDATE account SET qvit_balance = qvit_balance - ?, paid_blocks_day = paid_blocks_day + 1, paid_blocks_month = paid_blocks_month + 1, qvit_debit_day = qvit_debit_day + ?, qvit_debit_month = qvit_debit_month + ? WHERE id = 1',
        reserved,reserved,reserved
      );
    }
    const leaseId=crypto.randomUUID();
    const capabilityHash=String(body.capabilityHash||'');
    if(!validToken(capabilityHash))return this.reply({error:'invalid_capability_hash'},400);
    const expires=now+AGGY_PENDING_LEASE_MS;
    this.sql.exec(
      "INSERT INTO leases (lease_id,capability_hash,kind,status,duration_ms,reserved_qvit,created_at_ms,expires_at_ms) VALUES (?,?,?,'PENDING',?,?,?,?)",
      leaseId,capabilityHash,kind,duration,reserved,now,expires
    );
    if(reserved)this.ledger(`reserve:${leaseId}`,'QUPAY_QVIT_RESERVED',-reserved,{kind,durationMs:duration,quote:aggyBlockQuote()},now);
    await this.ctx.storage.setAlarm(expires);
    return this.reply({
      schema:'secquoia.aggy.usage-lease.v1',
      leaseId,
      kind,
      status:'PENDING',
      durationSeconds:duration/1000,
      pendingExpiresAt:new Date(expires).toISOString(),
      reservedQVit:reserved,
      balanceQVit:Number(this.account().qvit_balance),
      quote:aggyBlockQuote()
    },201);
  }
  async activate(body,now){
    this.closeExpired(now);
    const row=[...this.sql.exec('SELECT * FROM leases WHERE lease_id = ?',String(body.leaseId||''))][0];
    if(!this.validCapability(row,String(body.capabilityHash||'')))return this.reply({error:'invalid_lease_capability'},401);
    if(row.status!=='PENDING')return this.reply({error:'lease_not_pending',status:row.status},409);
    const expires=now+Number(row.duration_ms);
    this.sql.exec("UPDATE leases SET status='ACTIVE',started_at_ms=?,expires_at_ms=? WHERE lease_id=?",now,expires,row.lease_id);
    await this.ctx.storage.setAlarm(expires);
    return this.reply({authorized:true,leaseId:row.lease_id,kind:row.kind,expiresAt:new Date(expires).toISOString()});
  }
  bindProvider(body,now){
    const row=[...this.sql.exec('SELECT * FROM leases WHERE lease_id = ?',String(body.leaseId||''))][0];
    if(!this.validCapability(row,String(body.capabilityHash||'')))return this.reply({error:'invalid_lease_capability'},401);
    if(row.status!=='ACTIVE')return this.reply({error:'lease_not_active'},409);
    this.sql.exec('UPDATE leases SET provider_established=1,provider_call_id=? WHERE lease_id=?',String(body.providerCallId||'').slice(0,160)||null,row.lease_id);
    this.ledger(`provider:${row.lease_id}`,'OPENAI_REALTIME_SESSION_OPENED',0,{callIdStored:Boolean(body.providerCallId)},now);
    return this.reply({bound:true,expiresAt:new Date(Number(row.expires_at_ms)).toISOString()});
  }
  async cancel(body,now){
    const row=[...this.sql.exec('SELECT * FROM leases WHERE lease_id = ?',String(body.leaseId||''))][0];
    if(!this.validCapability(row,String(body.capabilityHash||'')))return this.reply({error:'invalid_lease_capability'},401);
    if(!['PENDING','ACTIVE'].includes(row.status)||Number(row.provider_established))return this.reply({error:'lease_not_refundable'},409);
    if(row.kind==='PAID'&&row.reserved_qvit>0){
      this.sql.exec(
        'UPDATE account SET qvit_balance = qvit_balance + ?, paid_blocks_day = MAX(0,paid_blocks_day - 1), paid_blocks_month = MAX(0,paid_blocks_month - 1), qvit_debit_day = MAX(0,qvit_debit_day - ?), qvit_debit_month = MAX(0,qvit_debit_month - ?) WHERE id = 1',
        row.reserved_qvit,row.reserved_qvit,row.reserved_qvit
      );
      this.ledger(`refund:${row.lease_id}`,'QUPAY_QVIT_RESERVATION_REFUND',row.reserved_qvit,{reason:String(body.reason||'provider_failure').slice(0,80)},now);
    }
    this.sql.exec("UPDATE leases SET status='CANCELLED',ended_at_ms=?,end_reason=? WHERE lease_id=?",now,String(body.reason||'provider_failure').slice(0,80),row.lease_id);
    await this.ctx.storage.deleteAlarm();
    return this.reply({cancelled:true,refundedQVit:row.kind==='PAID'?Number(row.reserved_qvit):0});
  }
  heartbeat(body,now){
    this.closeExpired(now);
    const row=[...this.sql.exec('SELECT * FROM leases WHERE lease_id = ?',String(body.leaseId||''))][0];
    if(!this.validCapability(row,String(body.capabilityHash||'')))return this.reply({error:'invalid_lease_capability'},401);
    if(row.status!=='ACTIVE')return this.reply({error:'lease_expired',hardStop:true,status:row.status},402);
    const remaining=Math.max(0,Number(row.expires_at_ms)-now);
    return this.reply({ok:true,leaseId:row.lease_id,kind:row.kind,remainingSeconds:Math.ceil(remaining/1000),hardStop:remaining<=0});
  }
  usage(body,now){
    this.closeExpired(now);
    const row=[...this.sql.exec('SELECT * FROM leases WHERE lease_id = ?',String(body.leaseId||''))][0];
    if(!this.validCapability(row,String(body.capabilityHash||'')))return this.reply({error:'invalid_lease_capability'},401);
    if(row.status!=='ACTIVE')return this.reply({error:'lease_not_active',hardStop:true},402);
    const responseId=String(body.responseId||'').slice(0,180);
    if(!responseId)return this.reply({error:'response_id_required'},400);
    const quote=quoteRealtimeUsage(body.usage||{});
    try{
      this.sql.exec(
        'INSERT INTO usage_receipts (response_id,lease_id,usage_json,quote_json,provider_cost_qcu,created_at_ms) VALUES (?,?,?,?,?,?)',
        responseId,row.lease_id,JSON.stringify(body.usage||{}),JSON.stringify(quote),quote.providerCostQcu,now
      );
    }catch{
      return this.reply({accepted:true,duplicate:true,hardStop:false});
    }
    const total=this.sql.exec('SELECT COALESCE(SUM(provider_cost_qcu),0) AS total FROM usage_receipts WHERE lease_id = ?',row.lease_id).one();
    const providerCostQcu=Number(total.total);
    const providerReserveQcu=Math.round(AGGY_PROVIDER_RESERVE_USD*1e6);
    const hardStop=providerCostQcu>=Math.round(providerReserveQcu*AGGY_QUOPTIO_STOP_RATIO);
    return this.reply({accepted:true,duplicate:false,quote,providerCostQcu,providerReserveQcu,hardStop});
  }
  async settle(body,now){
    this.closeExpired(now);
    const row=[...this.sql.exec('SELECT * FROM leases WHERE lease_id = ?',String(body.leaseId||''))][0];
    if(!this.validCapability(row,String(body.capabilityHash||'')))return this.reply({error:'invalid_lease_capability'},401);
    if(row.status!=='ACTIVE')return this.reply({settled:true,status:row.status});
    const elapsed=Math.max(0,Math.min(Number(row.duration_ms),now-Number(row.started_at_ms)));
    if(row.kind==='FREE')this.sql.exec('UPDATE account SET free_used_ms = MIN(?,free_used_ms + ?) WHERE id = 1',AGGY_FREE_MS,elapsed);
    this.sql.exec("UPDATE leases SET status='ENDED',ended_at_ms=?,end_reason=? WHERE lease_id=?",now,String(body.reason||'CLIENT_END').slice(0,80),row.lease_id);
    const usage=this.sql.exec('SELECT COALESCE(SUM(provider_cost_qcu),0) AS provider_cost_qcu,COUNT(*) AS responses FROM usage_receipts WHERE lease_id = ?',row.lease_id).one();
    this.ledger(`settle:${row.lease_id}`,'QUCFA_QVIT_LEASE_SETTLED',0,{kind:row.kind,elapsedMs:elapsed,chargedQVit:row.reserved_qvit,providerCostQcu:Number(usage.provider_cost_qcu),responses:Number(usage.responses)},now);
    await this.ctx.storage.deleteAlarm();
    return this.reply({settled:true,elapsedSeconds:Math.ceil(elapsed/1000),chargedQVit:Number(row.reserved_qvit),providerCostQcu:Number(usage.provider_cost_qcu),status:this.status(now)});
  }
  credit(body,now){
    const amount=Math.floor(Number(body.qvitAmount));
    const eventId=String(body.eventId||'').slice(0,180);
    if(!eventId||!Number.isSafeInteger(amount)||amount<=0||amount>1_000_000_000)return this.reply({error:'invalid_credit'},400);
    const existing=[...this.sql.exec('SELECT event_id FROM ledger WHERE event_id = ?',eventId)][0];
    if(existing)return this.reply({credited:true,duplicate:true,balanceQVit:Number(this.account().qvit_balance)});
    this.sql.exec('UPDATE account SET qvit_balance = qvit_balance + ? WHERE id = 1',amount);
    this.ledger(eventId,'QUPAY_CONFIRMED_QVIT_CREDIT',amount,{receiptId:String(body.receiptId||'').slice(0,180)},now);
    return this.reply({credited:true,duplicate:false,balanceQVit:Number(this.account().qvit_balance)});
  }
  async fetch(request){
    const url=new URL(request.url);
    const now=Date.now();
    if(url.pathname==='/status'&&request.method==='GET')return this.reply(this.status(now));
    const body=await this.body(request);
    if(url.pathname==='/lease'&&request.method==='POST')return this.openLease(body,now);
    if(url.pathname==='/activate'&&request.method==='POST')return this.activate(body,now);
    if(url.pathname==='/bind'&&request.method==='POST')return this.bindProvider(body,now);
    if(url.pathname==='/cancel'&&request.method==='POST')return this.cancel(body,now);
    if(url.pathname==='/heartbeat'&&request.method==='POST')return this.heartbeat(body,now);
    if(url.pathname==='/usage'&&request.method==='POST')return this.usage(body,now);
    if(url.pathname==='/settle'&&request.method==='POST')return this.settle(body,now);
    if(url.pathname==='/credit'&&request.method==='POST')return this.credit(body,now);
    return this.reply({error:'not_found'},404);
  }
  async alarm(){
    this.closeExpired(Date.now());
  }
}

const meterStub=async(env,request,walletReference)=>{
  if(!env.AGGY_USAGE_METERS)return null;
  const reference=walletReference||await usageSubject(request);
  if(!validRoomId(reference))return null;
  return {reference,stub:env.AGGY_USAGE_METERS.get(env.AGGY_USAGE_METERS.idFromName(reference))};
};
const meterRequest=(stub,path,method='GET',body)=>stub.fetch(new Request(`https://aggy-meter.internal${path}`,{
  method,
  headers:body?{'Content-Type':'application/json'}:undefined,
  body:body?JSON.stringify(body):undefined
}));
const verifyQuPaySignature=async(request,secret,raw)=>{
  if(!secret)return false;
  const header=request.headers.get('X-QuPay-Signature')||'';
  const timestamp=Number((header.match(/(?:^|,)t=(\d+)/)||[])[1]);
  const signature=(header.match(/(?:^|,)v1=([0-9a-f]{64})/i)||[])[1]?.toLowerCase();
  if(!timestamp||!signature||Math.abs(Date.now()/1000-timestamp)>300)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const actual=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${raw}`)));
  const expected=Uint8Array.from(signature.match(/../g).map(byte=>Number.parseInt(byte,16)));
  if(actual.length!==expected.length)return false;
  let mismatch=0;
  for(let i=0;i<actual.length;i++)mismatch|=actual[i]^expected[i];
  return mismatch===0;
};

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/aggy/messages/health'&&request.method==='GET'){
      return json({
        schema:'secquoia.aggy.secure-messages.health.v1',
        cryptoProfile:'E2EE/PQC',
        status:env.AGGY_CHAT_ROOMS?'ready':'not_configured',
        release:AGGY_RELEASE,
        storage:'Durable Objects SQLite · ciphertext and public keys only',
        textSanitizer:'QuSOC internal text policy',
        attachments:{
          enabled:false,
          provider:'Glasswall',
          mode:env.AGGY_GLASSWALL_MODE||'STRUCTURE_READY_NOT_CONNECTED',
          externalCallsExecuted:false
        },
        identityBinding:'MANUAL_FINGERPRINT',
        quidentifyOrganizationBinding:false
      },env.AGGY_CHAT_ROOMS?200:503,request);
    }
    if(url.pathname==='/api/aggy/messages/sanitize'){
      if(request.method==='OPTIONS'){
        if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
        return new Response(null,{status:204,headers:corsHeaders(request)});
      }
      if(request.method!=='POST')return json({error:'method_not_allowed'},405,request);
      let body;
      try{body=await safeJson(request)}catch(error){return json({error:error.message},400,request)}
      let sanitizedText;
      try{sanitizedText=sanitizeChatText(body.text)}catch(error){return json({error:error.message,quarantined:true},422,request)}
      const now=new Date().toISOString();
      return json({
        sanitizedText,
        receipt:{
          schema:'secquoia.qusoc.chat-text-admission.v1',
          receiptId:crypto.randomUUID(),
          issuedAt:now,
          policy:'AGGY_TEXT_ONLY_V1',
          admissionAuthorized:true,
          quvaultAuthorized:true,
          persistedBySanitizer:false,
          bodyLogged:false,
          stages:{
            quarantine:'PASS_TRANSIENT',
            unicodeNormalization:'PASS_NFKC',
            controlCharacterRemoval:'PASS',
            executableContent:'PASS_TEXT_RENDER_ONLY',
            reconstruction:'PASS'
          },
          limitations:['NO_ATTACHMENT_SCAN','NO_MALWARE_ENGINE','GLASSWALL_NOT_CONNECTED']
        }
      },200,request);
    }
    const roomMatch=url.pathname.match(/^\/api\/aggy\/messages\/rooms\/([A-Za-z0-9_-]{43})(\/bundles|\/messages)$/);
    if(roomMatch){
      if(request.method==='OPTIONS'){
        if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
        return new Response(null,{status:204,headers:corsHeaders(request)});
      }
      if(!env.AGGY_CHAT_ROOMS)return json({error:'secure_messages_not_configured'},503,request);
      const id=env.AGGY_CHAT_ROOMS.idFromName(roomMatch[1]);
      const stub=env.AGGY_CHAT_ROOMS.get(id);
      const target=new URL(request.url);
      target.pathname=roomMatch[2];
      return roomResponse(await stub.fetch(new Request(target,request)),request);
    }
    if(url.pathname==='/api/aggy/messages/attachments'){
      return json({
        error:'attachments_fail_closed',
        provider:'Glasswall',
        mode:env.AGGY_GLASSWALL_MODE||'STRUCTURE_READY_NOT_CONNECTED',
        externalCallsExecuted:false
      },503,request);
    }
    if(url.pathname==='/api/aggy/calls/preflight'){
      if(request.method==='OPTIONS'){
        if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
        return new Response(null,{status:204,headers:corsHeaders(request)});
      }
      if(request.method!=='GET')return json({error:'method_not_allowed'},405,request);
      return json({
        schema:'secquoia.aggy.calls.preflight.v1',
        service:'Aggy Calls',
        release:AGGY_RELEASE,
        status:'not_configured',
        error:'e2ee_call_infrastructure_not_configured',
        e2eeVerified:false,
        microphoneRequested:false,
        cameraRequested:false,
        gates:{
          identityBinding:false,
          signaling:false,
          keyExchange:false,
          mediaE2EE:false,
          qufense:false,
          quvault:false
        },
        cryptoProfile:'E2EE/PQC',
        requiredServices:['QuIdentify identity binding','WebRTC signaling','ephemeral group key exchange','encoded media E2EE/PQC','QuFense receipt','QuVault receipt']
      },503,request);
    }
    if(url.pathname.startsWith('/api/aggy/usage/')){
      if(request.method==='OPTIONS'){
        if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
        return new Response(null,{status:204,headers:corsHeaders(request)});
      }
      if(!env.AGGY_USAGE_METERS)return json({error:'usage_meter_not_configured',failClosed:true},503,request);
      if(!rateCardIsCurrent())return json({error:'aggy_rate_card_stale',failClosed:true,rateCardVersion:AGGY_RATE_CARD.version},503,request);
      if(url.pathname==='/api/aggy/usage/qupay-credit'){
        if(request.method!=='POST')return json({error:'method_not_allowed'},405,request);
        if(!env.AGGY_QUPAY_WEBHOOK_SECRET){
          return json({error:'qupay_credit_not_configured',failClosed:true},503,request);
        }
        const raw=await request.text();
        if(!await verifyQuPaySignature(request,env.AGGY_QUPAY_WEBHOOK_SECRET,raw)){
          return json({error:'invalid_qupay_signature'},401,request);
        }
        let body;
        try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400,request)}
        if(body.schema!=='secquoia.qupay.aggy-qvit-credit.v1'||body.paymentStatus!=='CONFIRMED'){
          return json({error:'unconfirmed_or_invalid_qupay_event'},422,request);
        }
        const meter=await meterStub(env,request,String(body.walletReference||''));
        if(!meter)return json({error:'invalid_wallet_reference'},400,request);
        return roomResponse(await meterRequest(meter.stub,'/credit','POST',body),request);
      }
      const meter=await meterStub(env,request);
      if(!meter)return json({error:'invalid_usage_subject'},400,request);
      if(url.pathname==='/api/aggy/usage/status'&&request.method==='GET'){
        const response=await meterRequest(meter.stub,'/status');
        const body=await response.json();
        body.wallet.reference=meter.reference;
        body.wallet.topUpAvailable=Boolean(env.AGGY_QUPAY_WEBHOOK_SECRET);
        body.wallet.topUpStatus=body.wallet.topUpAvailable?'QUPAY_SIGNED_WEBHOOK_READY':'ASSISTED_ACTIVATION_REQUIRED';
        body.wallet.topUpUrl=body.wallet.topUpAvailable
          ? `https://secquoia.net/qu-market.html?addon=qvit-ai-credit-25&wallet_ref=${encodeURIComponent(meter.reference)}#ai-services`
          : 'mailto:sqaile@secquoia.group?subject=Activacion%20QuPay%20para%20Aggy';
        body.identity={engine:'QuIdentify',binding:'EDGE_PSEUDONYMOUS_V1',verified:false,paidContinuationRequiresVerifiedQuPayWebhook:true};
        return json(body,response.status,request);
      }
      if(url.pathname==='/api/aggy/usage/lease'&&request.method==='POST'){
        const capability=randomCapability();
        const capabilityHash=await sha256Hex(capability);
        const response=await meterRequest(meter.stub,'/lease','POST',{capabilityHash});
        const body=await response.json();
        if(response.ok)body.capability=capability;
        body.walletReference=meter.reference;
        if(body.wallet)body.wallet.topUpUrl=`https://secquoia.net/qu-market.html?addon=qvit-ai-credit-25&wallet_ref=${encodeURIComponent(meter.reference)}#ai-services`;
        return json(body,response.status,request);
      }
      let body;
      try{body=await safeJson(request)}catch(error){return json({error:error.message},400,request)}
      const capability=String(body.capability||'');
      if(!validToken(capability))return json({error:'invalid_lease_capability'},401,request);
      const internal={...body,capabilityHash:await sha256Hex(capability)};
      if(url.pathname==='/api/aggy/usage/heartbeat'&&request.method==='POST'){
        return roomResponse(await meterRequest(meter.stub,'/heartbeat','POST',internal),request);
      }
      if(url.pathname==='/api/aggy/usage/response'&&request.method==='POST'){
        return roomResponse(await meterRequest(meter.stub,'/usage','POST',internal),request);
      }
      if(url.pathname==='/api/aggy/usage/end'&&request.method==='POST'){
        return roomResponse(await meterRequest(meter.stub,'/settle','POST',internal),request);
      }
      return json({error:'not_found'},404,request);
    }
    if(url.pathname==='/api/aggy/version'&&request.method==='GET'){
      return json({
        schema:'secquoia.aggy.release.v1',
        product:'Aggy',
        ...AGGY_RELEASE
      },200,request);
    }
    if(url.pathname==='/api/aggy/realtime/health'&&request.method==='GET'){
      const rateCardCurrent=rateCardIsCurrent();
      return json({
        status:env.OPENAI_API_KEY&&env.AGGY_USAGE_METERS&&rateCardCurrent?'ready':'not_configured',
        service:'Aggy Voice',
        transport:'WebRTC',
        model:env.OPENAI_REALTIME_MODEL||DEFAULT_REALTIME_MODEL,
        voice:DEFAULT_REALTIME_VOICE,
        voiceIdentity:'feminine',
        defaultLocale:'es-CO',
        release:AGGY_RELEASE,
        qugeo:qugeo(request),
        microphonePermissionRequired:true,
        usageMeter:env.AGGY_USAGE_METERS?'ready':'not_configured',
        freeSeconds:AGGY_FREE_MS/1000,
        continuation:aggyBlockQuote(),
        rateCardCurrent,
        paidContinuation:{
          status:env.AGGY_QUPAY_WEBHOOK_SECRET?'ready':'blocked',
          quPayWebhook:env.AGGY_QUPAY_WEBHOOK_SECRET?'configured':'not_configured',
          failClosed:true
        },
        limits:{paidMinutesDay:AGGY_MAX_PAID_BLOCKS_DAY,paidMinutesMonth:AGGY_MAX_PAID_BLOCKS_MONTH},
        quOptio:AGGY_QUOPTIO_POLICY,
        providerCallExecuted:false
      },env.OPENAI_API_KEY&&env.AGGY_USAGE_METERS&&rateCardCurrent?200:503,request);
    }
    if(url.pathname!=='/api/aggy/realtime/session')return json({error:'not_found'},404,request);
    if(request.method==='OPTIONS'){
      if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
      return new Response(null,{status:204,headers:corsHeaders(request)});
    }
    if(request.method!=='POST')return json({error:'method_not_allowed'},405,request);
    if(!env.OPENAI_API_KEY)return json({error:'realtime_not_configured'},503,request);
    if(!env.AGGY_USAGE_METERS)return json({error:'usage_meter_not_configured',failClosed:true},503,request);
    if(!rateCardIsCurrent())return json({error:'aggy_rate_card_stale',failClosed:true,rateCardVersion:AGGY_RATE_CARD.version},503,request);

    const leaseId=String(request.headers.get('X-Aggy-Lease')||'');
    const leaseCapability=String(request.headers.get('X-Aggy-Lease-Capability')||'');
    if(!/^[0-9a-f-]{36}$/i.test(leaseId)||!validToken(leaseCapability)){
      return json({error:'usage_lease_required',failClosed:true},402,request);
    }
    const meter=await meterStub(env,request);
    if(!meter)return json({error:'invalid_usage_subject'},400,request);
    const capabilityHash=await sha256Hex(leaseCapability);

    const contentType=(request.headers.get('Content-Type')||'').split(';',1)[0].trim();
    if(contentType!=='application/sdp')return json({error:'application_sdp_required'},415,request);

    const sdp=await request.text();
    if(!sdp.startsWith('v=0')||new TextEncoder().encode(sdp).byteLength>MAX_SDP_BYTES){
      return json({error:'invalid_sdp'},400,request);
    }
    const activation=await meterRequest(meter.stub,'/activate','POST',{leaseId,capabilityHash});
    if(!activation.ok)return roomResponse(activation,request);

    const model=env.OPENAI_REALTIME_MODEL||DEFAULT_REALTIME_MODEL;
    const voice=DEFAULT_REALTIME_VOICE;
    const session=JSON.stringify({
      type:'realtime',
      model,
      audio:{output:{voice}}
    });
    const form=new FormData();
    form.set('sdp',sdp);
    form.set('session',session);

    let upstream;
    try{
      upstream=await fetch('https://api.openai.com/v1/realtime/calls',{
        method:'POST',
        headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},
        body:form,
        signal:AbortSignal.timeout(12000)
      });
    }catch{
      await meterRequest(meter.stub,'/cancel','POST',{leaseId,capabilityHash,reason:'realtime_provider_unavailable'});
      return json({error:'realtime_provider_unavailable'},502,request);
    }

    const body=await upstream.text();
    if(!upstream.ok){
      let providerCode='unknown';
      try{
        const detail=JSON.parse(body);
        providerCode=String(detail?.error?.code||detail?.error?.type||'unknown').slice(0,80);
      }catch{}
      await meterRequest(meter.stub,'/cancel','POST',{leaseId,capabilityHash,reason:`provider_${upstream.status}_${providerCode}`});
      return json({error:'realtime_session_rejected',providerStatus:upstream.status,providerCode},502,request);
    }
    if(!body.startsWith('v=0')){
      await meterRequest(meter.stub,'/cancel','POST',{leaseId,capabilityHash,reason:'invalid_provider_sdp'});
      return json({error:'invalid_provider_sdp'},502,request);
    }
    const providerCallId=(upstream.headers.get('Location')||'').split('/').pop()||'';
    const bound=await meterRequest(meter.stub,'/bind','POST',{leaseId,capabilityHash,providerCallId});
    if(!bound.ok)return json({error:'usage_lease_binding_failed',failClosed:true},502,request);
    const lease=await bound.json();

    return new Response(body,{
      status:200,
      headers:{
        'Content-Type':'application/sdp',
        'Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff',
        'X-Aggy-Lease-Expires-At':lease.expiresAt,
        ...corsHeaders(request)
      }
    });
  }
};

export {
  AGGY_RELEASE,
  AGGY_RATE_CARD,
  AGGY_PAID_BLOCK_QVIT,
  AGGY_QUOPTIO_POLICY,
  AggyChatRoom,
  AggyUsageMeter,
  DEFAULT_REALTIME_MODEL,
  DEFAULT_REALTIME_VOICE,
  aggyBlockQuote,
  normalizeRealtimeUsage,
  quoteRealtimeUsage,
  qugeo,
  rateCardIsCurrent,
  sanitizeChatText,
  usageSubject,
  validateEnvelope,
  validatePublicBundle
};
