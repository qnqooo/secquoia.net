const DEFAULT_REALTIME_MODEL='gpt-realtime-2.1';
const DEFAULT_REALTIME_VOICE='marin';
const MAX_SDP_BYTES=64*1024;
const ALLOWED_ORIGINS=new Set(['https://secquoia.net','https://www.secquoia.net']);

const corsHeaders=request=>{
  const origin=request.headers.get('Origin');
  if(!ALLOWED_ORIGINS.has(origin))return {};
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
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
    const voice=env.OPENAI_REALTIME_VOICE||DEFAULT_REALTIME_VOICE;
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

export {DEFAULT_REALTIME_MODEL,DEFAULT_REALTIME_VOICE};
