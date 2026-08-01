const RELEASE='1.0.0';
const ORIGIN='https://quidentify.secquoia.group/internal/qufense';
const ALLOWED=new Set(['/readyz','/v1/payments/checkout/authorize']);
const json=(body,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
});

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!env.SQAILE_MESH_SERVICE_TOKEN)return json({error:'qufense_edge_not_configured',failClosed:true},503);
    if(!ALLOWED.has(url.pathname))return json({error:'not_found'},404);
    if((url.pathname==='/readyz'&&request.method!=='GET')||(url.pathname==='/v1/payments/checkout/authorize'&&request.method!=='POST')){
      return json({error:'method_not_allowed'},405);
    }
    const headers=new Headers({Authorization:`Bearer ${env.SQAILE_MESH_SERVICE_TOKEN}`});
    if(request.method==='POST')headers.set('Content-Type','application/json');
    let response;
    try{
      response=await fetch(`${ORIGIN}${url.pathname}`,{
        method:request.method,
        headers,
        body:request.method==='POST'?await request.text():undefined,
        signal:AbortSignal.timeout(30_000)
      });
    }catch{
      return json({error:'qufense_origin_unavailable',failClosed:true},503);
    }
    const outbound=new Headers(response.headers);
    outbound.set('Cache-Control','no-store');
    outbound.set('X-Content-Type-Options','nosniff');
    outbound.set('X-QuFense-Edge-Version',RELEASE);
    return new Response(response.body,{status:response.status,headers:outbound});
  }
};
