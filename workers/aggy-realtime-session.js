const DEFAULT_REALTIME_MODEL='gpt-realtime-2.1';
const DEFAULT_REALTIME_VOICE='marin';
const AGGY_RELEASE=Object.freeze({
  version:'1.0.0-rc.14',
  channel:'rc',
  lifecycle:'production-validation',
  distribution:'ecosystem-hosted',
  productionApproved:false,
  thirdPartySale:false
});
const MAX_SDP_BYTES=64*1024;
const MAX_CHAT_TEXT_BYTES=4*1024;
const MAX_CHAT_BODY_BYTES=160*1024;
const ALLOWED_ORIGINS=new Set(['https://secquoia.net','https://www.secquoia.net']);
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
    'Access-Control-Allow-Headers':'Content-Type, Authorization',
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
    if(url.pathname==='/api/aggy/version'&&request.method==='GET'){
      return json({
        schema:'secquoia.aggy.release.v1',
        product:'Aggy',
        ...AGGY_RELEASE
      },200,request);
    }
    if(url.pathname==='/api/aggy/realtime/health'&&request.method==='GET'){
      return json({
        status:env.OPENAI_API_KEY?'ready':'not_configured',
        service:'Aggy Voice',
        transport:'WebRTC',
        model:env.OPENAI_REALTIME_MODEL||DEFAULT_REALTIME_MODEL,
        voice:DEFAULT_REALTIME_VOICE,
        voiceIdentity:'feminine',
        defaultLocale:'es-CO',
        release:AGGY_RELEASE,
        qugeo:qugeo(request),
        microphonePermissionRequired:true,
        providerCallExecuted:false
      },env.OPENAI_API_KEY?200:503,request);
    }
    if(url.pathname!=='/api/aggy/realtime/session')return json({error:'not_found'},404,request);
    if(request.method==='OPTIONS'){
      if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403,request);
      return new Response(null,{status:204,headers:corsHeaders(request)});
    }
    if(request.method!=='POST')return json({error:'method_not_allowed'},405,request);
    if(!env.OPENAI_API_KEY)return json({error:'realtime_not_configured'},503,request);

    const contentType=(request.headers.get('Content-Type')||'').split(';',1)[0].trim();
    if(contentType!=='application/sdp')return json({error:'application_sdp_required'},415,request);

    const sdp=await request.text();
    if(!sdp.startsWith('v=0')||new TextEncoder().encode(sdp).byteLength>MAX_SDP_BYTES){
      return json({error:'invalid_sdp'},400,request);
    }

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
      return json({error:'realtime_provider_unavailable'},502,request);
    }

    const body=await upstream.text();
    if(!upstream.ok){
      let providerCode='unknown';
      try{
        const detail=JSON.parse(body);
        providerCode=String(detail?.error?.code||detail?.error?.type||'unknown').slice(0,80);
      }catch{}
      return json({error:'realtime_session_rejected',providerStatus:upstream.status,providerCode},502,request);
    }
    if(!body.startsWith('v=0'))return json({error:'invalid_provider_sdp'},502,request);

    return new Response(body,{
      status:200,
      headers:{
        'Content-Type':'application/sdp',
        'Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff',
        ...corsHeaders(request)
      }
    });
  }
};

export {AGGY_RELEASE,AggyChatRoom,DEFAULT_REALTIME_MODEL,DEFAULT_REALTIME_VOICE,qugeo,sanitizeChatText,validateEnvelope,validatePublicBundle};
