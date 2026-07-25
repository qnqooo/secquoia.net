const DEFAULT_REALTIME_MODEL='gpt-realtime-2.1';
const DEFAULT_REALTIME_VOICE='marin';
const MAX_SDP_BYTES=64*1024;

const json=(body,status=400)=>new Response(JSON.stringify(body),{
  status,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
});

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=='/api/aggy/realtime/session')return json({error:'not_found'},404);
    if(request.method!=='POST')return json({error:'method_not_allowed'},405);
    if(!env.OPENAI_API_KEY)return json({error:'realtime_not_configured'},503);

    const contentType=(request.headers.get('Content-Type')||'').split(';',1)[0].trim();
    if(contentType!=='application/sdp')return json({error:'application_sdp_required'},415);

    const sdp=await request.text();
    if(!sdp.startsWith('v=0')||new TextEncoder().encode(sdp).byteLength>MAX_SDP_BYTES){
      return json({error:'invalid_sdp'},400);
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
      return json({error:'realtime_provider_unavailable'},502);
    }

    const body=await upstream.text();
    if(!upstream.ok){
      return json({error:'realtime_session_rejected',providerStatus:upstream.status},502);
    }
    if(!body.startsWith('v=0'))return json({error:'invalid_provider_sdp'},502);

    return new Response(body,{
      status:200,
      headers:{
        'Content-Type':'application/sdp',
        'Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff'
      }
    });
  }
};

export {DEFAULT_REALTIME_MODEL,DEFAULT_REALTIME_VOICE};
