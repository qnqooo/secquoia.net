const ALLOWED_ORIGINS=new Set(['https://secquoia.net','https://www.secquoia.net']);
const MAX_BODY_BYTES=64*1024;
const MAX_MESSAGE_CHARS=24_000;
const QVIT_PER_USD=1_000_000;
const TARGET_MARGIN_BPS=3500;

const RATE_CARDS=Object.freeze({
  openai:Object.freeze({version:'2026-07-09',sourceRef:'https://openai.com/index/gpt-5-6/',rates:{inputTokens:5/1e6,cachedInputTokens:.5/1e6,outputTokens:30/1e6}}),
  anthropic:Object.freeze({version:'2026-06-09',sourceRef:'https://platform.claude.com/docs/en/about-claude/pricing',rates:{inputTokens:10/1e6,cacheWriteInputTokens:12.5/1e6,cachedInputTokens:1/1e6,outputTokens:50/1e6}}),
  google:Object.freeze({version:'2026-07-21',sourceRef:'https://ai.google.dev/gemini-api/docs/pricing',rates:{inputTokens:1.5/1e6,cachedInputTokens:.15/1e6,outputTokens:7.5/1e6}}),
  xai:Object.freeze({version:'2026-07-17-standard-under-200k',sourceRef:'https://docs.x.ai/developers/pricing',rates:{inputTokens:2/1e6,cachedInputTokens:.3/1e6,outputTokens:6/1e6},constraints:['LONG_CONTEXT_RATE_REQUIRES_SEPARATE_QUOTE']}),
  mistral:Object.freeze({version:'2026-04-28',sourceRef:'https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04',rates:{inputTokens:1.5/1e6,outputTokens:7.5/1e6}}),
  deepseek:Object.freeze({version:'2026-07-24',sourceRef:'https://api-docs.deepseek.com/quick_start/pricing',rates:{inputTokens:.435/1e6,cachedInputTokens:.003625/1e6,outputTokens:.87/1e6}}),
  cohere:Object.freeze({version:'2026-05-20',sourceRef:'https://docs.cohere.com/docs/command-a-plus',rates:null,constraints:['PROVIDER_CONTRACT_OR_FREE_TIER_LIMIT_REQUIRED']})
});

const PROVIDERS=Object.freeze([
  {id:'openai',name:'OpenAI',model:'gpt-5.6-sol',secret:'OPENAI_API_KEY',strengths:['chat','research','analyze','create','agents']},
  {id:'anthropic',name:'Anthropic',model:'claude-fable-5',secret:'ANTHROPIC_API_KEY',strengths:['chat','research','analyze','create','agents']},
  {id:'google',name:'Google Gemini',model:'gemini-3.6-flash',secret:'GOOGLE_API_KEY',strengths:['chat','research','analyze','create','agents']},
  {id:'xai',name:'xAI',model:'grok-4.5',secret:'XAI_API_KEY',strengths:['chat','research','analyze','agents']},
  {id:'mistral',name:'Mistral AI',model:'mistral-medium-3-5',secret:'MISTRAL_API_KEY',strengths:['chat','analyze','create','agents']},
  {id:'cohere',name:'Cohere',model:'command-a-plus-05-2026',secret:'COHERE_API_KEY',strengths:['chat','research','analyze']},
  {id:'deepseek',name:'DeepSeek',model:'deepseek-v4-pro',secret:'DEEPSEEK_API_KEY',strengths:['chat','analyze','agents']}
]);

const PRIORITY=Object.freeze({
  chat:['openai','anthropic','google','xai','mistral','cohere','deepseek'],
  research:['google','xai','openai','anthropic','cohere'],
  analyze:['openai','anthropic','google','deepseek','mistral','cohere'],
  create:['anthropic','openai','google','mistral'],
  agents:['openai','anthropic','xai','google','mistral','deepseek']
});

const cors=request=>{
  const origin=request.headers.get('Origin');
  if(!ALLOWED_ORIGINS.has(origin))return {};
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, X-SECQUOIA-Client',
    'Access-Control-Max-Age':'86400',
    Vary:'Origin'
  };
};

const json=(request,body,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(request)}
});

const clean=(value,max=MAX_MESSAGE_CHARS)=>String(value??'').replace(/\0/g,'').trim().slice(0,max);
const outputText=data=>data?.output_text||data?.output?.flatMap(item=>item.content||[]).map(item=>item.text||item.output_text||'').join('')||'';
const chatText=data=>data?.choices?.[0]?.message?.content||'';
const secretLike=/\b(?:sk-(?:proj-)?|AIza|xai-|gsk_|hf_|AKIA)[A-Za-z0-9_\-]{12,}\b|-----BEGIN [A-Z ]+PRIVATE KEY-----/i;

const normalizeMessages=input=>{
  if(!Array.isArray(input)||!input.length||input.length>20)throw new Error('messages_invalid');
  const messages=input.map(message=>({
    role:['system','user','assistant'].includes(message?.role)?message.role:'user',
    content:clean(message?.content)
  })).filter(message=>message.content);
  if(!messages.some(message=>message.role==='user'))throw new Error('user_message_required');
  if(messages.some(message=>secretLike.test(message.content)))throw new Error('secret_like_input_blocked');
  return messages;
};

const providerById=id=>PROVIDERS.find(provider=>provider.id===id);
const configured=(provider,env)=>Boolean(clean(env[provider.secret],4096));
const pricingView=id=>{
  const card=RATE_CARDS[id];
  return {
    status:card.rates?'VERIFIED_PUBLIC_RATE_CARD':'CONTRACT_RATE_REQUIRED',
    version:card.version,
    sourceRef:card.sourceRef,
    rates:card.rates,
    constraints:card.constraints||[],
    currency:'USD',
    qvitPerUsd:QVIT_PER_USD,
    targetMarginBps:TARGET_MARGIN_BPS
  };
};
const catalog=env=>PROVIDERS.map(({secret,...provider})=>({...provider,available:configured({secret},env),pricing:pricingView(provider.id)}));

const usageNumber=value=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):0;
const normalizeUsage=(providerId,usage={})=>{
  if(providerId==='openai'){
    const cached=usageNumber(usage?.input_tokens_details?.cached_tokens);
    return {inputTokens:Math.max(0,usageNumber(usage.input_tokens)-cached),cachedInputTokens:cached,outputTokens:usageNumber(usage.output_tokens)};
  }
  if(providerId==='anthropic')return {inputTokens:usageNumber(usage.input_tokens),cacheWriteInputTokens:usageNumber(usage.cache_creation_input_tokens),cachedInputTokens:usageNumber(usage.cache_read_input_tokens),outputTokens:usageNumber(usage.output_tokens)};
  if(providerId==='google'){
    const cached=usageNumber(usage.cachedContentTokenCount);
    return {inputTokens:Math.max(0,usageNumber(usage.promptTokenCount)-cached),cachedInputTokens:cached,outputTokens:usageNumber(usage.candidatesTokenCount)+usageNumber(usage.thoughtsTokenCount)};
  }
  if(providerId==='cohere'){
    const billed=usage.billed_units||usage.tokens||{};
    return {inputTokens:usageNumber(billed.input_tokens),outputTokens:usageNumber(billed.output_tokens)};
  }
  const cached=usageNumber(usage?.prompt_tokens_details?.cached_tokens||usage?.input_tokens_details?.cached_tokens);
  return {inputTokens:Math.max(0,usageNumber(usage.prompt_tokens||usage.input_tokens)-cached),cachedInputTokens:cached,outputTokens:usageNumber(usage.completion_tokens||usage.output_tokens)};
};

const quoteUsage=(providerId,usage,{estimate=false}={})=>{
  const card=RATE_CARDS[providerId];
  if(!card?.rates)return {
    schema:'secquoia.qucfa.qvit.quote.v1',
    status:'CONTRACT_RATE_REQUIRED',
    provider:providerId,
    rateCard:{version:card?.version||null,sourceRef:card?.sourceRef||null},
    providerCostUsd:null,
    customerPriceUsd:null,
    customerQVit:null,
    estimate
  };
  const normalized=normalizeUsage(providerId,usage);
  const components=[];
  let providerCostUsd=0;
  for(const [resource,quantity] of Object.entries(normalized)){
    if(!quantity)continue;
    const rate=card.rates[resource];
    if(!Number.isFinite(rate))return {schema:'secquoia.qucfa.qvit.quote.v1',status:'RATE_COMPONENT_MISSING',provider:providerId,resource,estimate};
    const cost=quantity*rate;
    providerCostUsd+=cost;
    components.push({resource,quantity,providerUsdPerUnit:rate,providerCostUsd:Number(cost.toFixed(8))});
  }
  const customerPriceUsd=providerCostUsd/(1-TARGET_MARGIN_BPS/10_000);
  return {
    schema:'secquoia.qucfa.qvit.quote.v1',
    status:components.length?(estimate?'ESTIMATE_NOT_RESERVED':'RECONCILED_USAGE_NOT_DEBITED'):'NO_BILLABLE_USAGE_REPORTED',
    provider:providerId,
    rateCard:{version:card.version,sourceRef:card.sourceRef},
    components,
    providerCostQcu:Math.round(providerCostUsd*1e6),
    providerCostUsd:Number(providerCostUsd.toFixed(8)),
    targetMarginBps:TARGET_MARGIN_BPS,
    customerPriceUsd:Number(customerPriceUsd.toFixed(6)),
    customerQVit:Math.ceil(customerPriceUsd*QVIT_PER_USD),
    estimate,
    ledgerEnforcement:'PENDING_AUTHENTICATED_DURABLE_QVIT_BINDING'
  };
};

const estimateRequest=(providerId,messages)=>{
  const inputTokens=Math.ceil(messages.reduce((sum,message)=>sum+message.content.length,0)/4);
  return quoteUsage(providerId,{input_tokens:inputTokens,output_tokens:1200},{estimate:true});
};

async function invokeOpenAI(provider,messages,key){
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:provider.model,input:messages,store:false,reasoning:{effort:'medium'},max_output_tokens:1200}),
    signal:AbortSignal.timeout(25_000)
  });
  const data=await response.json();
  if(!response.ok)throw new Error(`provider_http_${response.status}`);
  return {reply:clean(outputText(data),20_000),usage:data.usage||null,responseId:data.id||null};
}

async function invokeAnthropic(provider,messages,key){
  const system=messages.filter(message=>message.role==='system').map(message=>message.content).join('\n');
  const response=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':key,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
    body:JSON.stringify({model:provider.model,system,max_tokens:1200,messages:messages.filter(message=>message.role!=='system')}),
    signal:AbortSignal.timeout(25_000)
  });
  const data=await response.json();
  if(!response.ok)throw new Error(`provider_http_${response.status}`);
  return {reply:clean((data.content||[]).map(item=>item.text||'').join(''),20_000),usage:data.usage||null,responseId:data.id||null};
}

async function invokeGoogle(provider,messages,key){
  const system=messages.filter(message=>message.role==='system').map(message=>message.content).join('\n');
  const contents=messages.filter(message=>message.role!=='system').map(message=>({role:message.role==='assistant'?'model':'user',parts:[{text:message.content}]}));
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`,{
    method:'POST',
    headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
    body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:1200}}),
    signal:AbortSignal.timeout(25_000)
  });
  const data=await response.json();
  if(!response.ok)throw new Error(`provider_http_${response.status}`);
  return {reply:clean(data?.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('')||'',20_000),usage:data.usageMetadata||null,responseId:null};
}

async function invokeOpenAICompatible(provider,messages,key,baseUrl){
  const response=await fetch(`${baseUrl}/chat/completions`,{
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:provider.model,messages,max_tokens:1200}),
    signal:AbortSignal.timeout(25_000)
  });
  const data=await response.json();
  if(!response.ok)throw new Error(`provider_http_${response.status}`);
  return {reply:clean(chatText(data),20_000),usage:data.usage||null,responseId:data.id||null};
}

async function invokeCohere(provider,messages,key){
  const response=await fetch('https://api.cohere.com/v2/chat',{
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:provider.model,messages,max_tokens:1200}),
    signal:AbortSignal.timeout(25_000)
  });
  const data=await response.json();
  if(!response.ok)throw new Error(`provider_http_${response.status}`);
  return {reply:clean(data?.message?.content?.map(item=>item.text||'').join('')||'',20_000),usage:data.usage||null,responseId:data.id||null};
}

const invoke=(provider,messages,key)=>{
  if(provider.id==='openai')return invokeOpenAI(provider,messages,key);
  if(provider.id==='anthropic')return invokeAnthropic(provider,messages,key);
  if(provider.id==='google')return invokeGoogle(provider,messages,key);
  if(provider.id==='xai')return invokeOpenAICompatible(provider,messages,key,'https://api.x.ai/v1');
  if(provider.id==='mistral')return invokeOpenAICompatible(provider,messages,key,'https://api.mistral.ai/v1');
  if(provider.id==='deepseek')return invokeOpenAICompatible(provider,messages,key,'https://api.deepseek.com');
  if(provider.id==='cohere')return invokeCohere(provider,messages,key);
  throw new Error('provider_not_supported');
};

const selectProvider=(request,env)=>{
  const orchestration=request.orchestration||{};
  const mode=orchestration.mode==='manual'?'manual':'sqaile';
  const task=PRIORITY[orchestration.task]?orchestration.task:'chat';
  if(mode==='manual'){
    const provider=providerById(clean(orchestration.provider,40).toLowerCase());
    if(!provider)throw new Error('provider_not_supported');
    if(!configured(provider,env))throw new Error('provider_not_configured');
    return {provider,strategy:'USER_SELECTED',task};
  }
  const provider=PRIORITY[task].map(providerById).find(candidate=>candidate&&configured(candidate,env));
  if(!provider)throw new Error('no_provider_configured');
  return {provider,strategy:'SQAILE_BEST_FIT',task};
};

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='OPTIONS'){
      if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json(request,{error:'origin_not_allowed'},403);
      return new Response(null,{status:204,headers:cors(request)});
    }
    if(url.pathname==='/v1/llm/catalog'&&request.method==='GET'){
      return json(request,{schema:'secquoia.quhub.llm.catalog.v1',orchestrator:'SQAILE Core',providers:catalog(env)});
    }
    if(url.pathname!=='/v1/llm/chat'||request.method!=='POST')return json(request,{error:'not_found'},404);
    if(!ALLOWED_ORIGINS.has(request.headers.get('Origin')))return json(request,{error:'origin_not_allowed'},403);
    if(Number(request.headers.get('Content-Length')||0)>MAX_BODY_BYTES)return json(request,{error:'payload_too_large'},413);

    try{
      const input=await request.json();
      if(input?.schema!=='secquoia.quhub.llm.chat.request.v1')throw new Error('schema_invalid');
      const messages=normalizeMessages(input.messages);
      const route=selectProvider(input,env);
      const estimate=estimateRequest(route.provider.id,messages);
      const started=Date.now();
      const result=await invoke(route.provider,messages,env[route.provider.secret]);
      if(!result.reply)throw new Error('provider_empty_response');
      const billing=quoteUsage(route.provider.id,result.usage||{});
      return json(request,{
        schema:'secquoia.quhub.llm.chat.response.v1',
        reply:result.reply,
        trace:{
          requestId:crypto.randomUUID(),
          orchestrator:'SQAILE Core',
          strategy:route.strategy,
          task:route.task,
          provider:route.provider.id,
          model:route.provider.model,
          latencyMs:Date.now()-started,
          responseId:result.responseId,
          usage:result.usage,
          billing:{estimate,reconciled:billing,qucfa:'ACCOUNTING_ONLY',qvitDebitExecuted:false,qupayChargeExecuted:false},
          store:false,
          browserSecrets:false
        }
      });
    }catch(error){
      const message=clean(error?.message,120);
      const status=/not_configured|no_provider/.test(message)?503:/provider_http|provider_empty/.test(message)?502:400;
      return json(request,{error:message},status);
    }
  }
};

export {PROVIDERS,PRIORITY,RATE_CARDS,normalizeMessages,normalizeUsage,quoteUsage,selectProvider};
