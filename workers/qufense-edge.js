const RELEASE='1.1.0';
const ORIGIN='https://quidentify.secquoia.group/internal/qufense';
const ALLOWED=new Set(['/readyz','/v1/payments/checkout/authorize','/v1/cdr/authorize']);
const json=(body,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
});
const SHA256=/^[0-9a-f]{64}$/;
const CDR_PROVIDERS=new Set(['glasswall-halo']);
const authorizeCdr=async request=>{
  let body;
  try{body=await request.json()}catch{return json({allowed:false,error:'invalid_json',failClosed:true},400)}
  const inputSha256=String(body?.inputSha256||'').toLowerCase();
  const outputSha256=String(body?.outputSha256||'').toLowerCase();
  const provider=String(body?.provider||'').toLowerCase();
  const inputBytes=Number(body?.inputBytes);
  const outputBytes=Number(body?.outputBytes);
  const allowed=body?.schema==='secquoia.quhub.cdr.authorization-request.v1'&&
    CDR_PROVIDERS.has(provider)&&SHA256.test(inputSha256)&&SHA256.test(outputSha256)&&
    inputSha256!==outputSha256&&Number.isInteger(inputBytes)&&inputBytes>0&&inputBytes<=32*1024*1024&&
    Number.isInteger(outputBytes)&&outputBytes>0&&outputBytes<=32*1024*1024;
  if(!allowed)return json({allowed:false,error:'cdr_policy_denied',failClosed:true},422);
  return json({
    schema:'secquoia.qufense.cdr-authorization.v1',
    allowed:true,
    evidenceId:`QF-CDR-${crypto.randomUUID()}`,
    policy:'CDR_REBUILT_HASH_BOUND_V1',
    provider,
    inputSha256,
    outputSha256,
    issuedAt:new Date().toISOString()
  });
};

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!env.SQAILE_MESH_SERVICE_TOKEN)return json({error:'qufense_edge_not_configured',failClosed:true},503);
    if(!ALLOWED.has(url.pathname))return json({error:'not_found'},404);
    if((url.pathname==='/readyz'&&request.method!=='GET')||(url.pathname!=='/readyz'&&request.method!=='POST')){
      return json({error:'method_not_allowed'},405);
    }
    if(url.pathname==='/v1/cdr/authorize')return authorizeCdr(request);
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
