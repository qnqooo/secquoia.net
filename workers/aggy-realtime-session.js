const DEFAULT_REALTIME_MODEL='gpt-realtime-2.1';
const DEFAULT_REALTIME_VOICE='marin';
const AGGY_RELEASE=Object.freeze({
  version:'1.0.0-rc.2',
  channel:'rc',
  lifecycle:'production-validation',
  distribution:'ecosystem-hosted',
  productionApproved:false,
  thirdPartySale:false
});
const MAX_SDP_BYTES=64*1024;
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
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
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

export default {
  async fetch(request,env){
    const url=new URL(request.url);
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
      return json({error:'realtime_session_rejected',providerStatus:upstream.status},502,request);
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

export {AGGY_RELEASE,DEFAULT_REALTIME_MODEL,DEFAULT_REALTIME_VOICE,qugeo};
