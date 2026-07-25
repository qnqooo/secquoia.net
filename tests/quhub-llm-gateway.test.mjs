import assert from 'node:assert/strict';
import test from 'node:test';
import worker,{PROVIDERS,RATE_CARDS,normalizeMessages,quoteUsage,selectProvider} from '../workers/quhub-llm-gateway.js';

const endpoint='https://quhub.secquoia.group/v1/llm/chat';
const origin='https://secquoia.net';

test('QuHub publishes the current governed model catalog without secret names',async()=>{
  const response=await worker.fetch(new Request('https://quhub.secquoia.group/v1/llm/catalog',{
    headers:{Origin:origin}
  }),{OPENAI_API_KEY:'test-key'});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.orchestrator,'SQAILE Core');
  assert.equal(body.providers.length,7);
  assert.equal(body.providers.find(provider=>provider.id==='openai').model,'gpt-5.6-sol');
  assert.equal(body.providers.find(provider=>provider.id==='openai').available,true);
  assert.equal(body.providers.find(provider=>provider.id==='anthropic').available,false);
  assert.equal(JSON.stringify(body).includes('OPENAI_API_KEY'),false);
});

test('SQAILE routes only to configured providers and manual mode honors the user',()=>{
  const automatic=selectProvider({orchestration:{mode:'sqaile',task:'research'}},{GOOGLE_API_KEY:'configured'});
  assert.equal(automatic.provider.id,'google');
  assert.equal(automatic.strategy,'SQAILE_BEST_FIT');
  const manual=selectProvider({orchestration:{mode:'manual',provider:'mistral',task:'create'}},{MISTRAL_API_KEY:'configured'});
  assert.equal(manual.provider.id,'mistral');
  assert.equal(manual.strategy,'USER_SELECTED');
  assert.throws(()=>selectProvider({orchestration:{mode:'manual',provider:'anthropic'}},{}),/provider_not_configured/);
});

test('QuHub rejects secret-like input before any provider call',()=>{
  assert.throws(()=>normalizeMessages([{role:'user',content:'use sk-proj-abcdefghijklmnopqrstuvwxyz'}]),/secret_like_input_blocked/);
});

test('QuHub calls the selected configured provider and returns an auditable trace',async()=>{
  const originalFetch=globalThis.fetch;
  let upstream;
  globalThis.fetch=async(url,init)=>{
    upstream={url,init};
    return new Response(JSON.stringify({id:'resp_test',output_text:'Respuesta gobernada',usage:{total_tokens:12}}),{
      status:200,headers:{'Content-Type':'application/json'}
    });
  };
  try{
    const response=await worker.fetch(new Request(endpoint,{
      method:'POST',
      headers:{Origin:origin,'Content-Type':'application/json'},
      body:JSON.stringify({
        schema:'secquoia.quhub.llm.chat.request.v1',
        orchestration:{mode:'manual',provider:'openai',task:'analyze'},
        messages:[{role:'user',content:'Analiza este escenario.'}]
      })
    }),{OPENAI_API_KEY:'test-key'});
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.reply,'Respuesta gobernada');
    assert.equal(body.trace.provider,'openai');
    assert.equal(body.trace.model,'gpt-5.6-sol');
    assert.equal(body.trace.strategy,'USER_SELECTED');
    assert.equal(upstream.url,'https://api.openai.com/v1/responses');
    assert.equal(upstream.init.headers.Authorization,'Bearer test-key');
    assert.equal(JSON.parse(upstream.init.body).store,false);
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('Provider registry contains no embedded credentials',()=>{
  assert.equal(PROVIDERS.some(provider=>Object.hasOwn(provider,'apiKey')),false);
  assert.equal(PROVIDERS.every(provider=>provider.secret.endsWith('_API_KEY')),true);
});

test('QuCFA converts verified provider usage to QCU and customer-facing QVits',()=>{
  const quote=quoteUsage('openai',{input_tokens:1000,input_tokens_details:{cached_tokens:200},output_tokens:100});
  assert.equal(quote.status,'RECONCILED_USAGE_NOT_DEBITED');
  assert.equal(quote.providerCostQcu,7100);
  assert.equal(quote.customerQVit,10924);
  assert.equal(quote.targetMarginBps,3500);
  assert.equal(quote.ledgerEnforcement,'PENDING_AUTHENTICATED_DURABLE_QVIT_BINDING');
});

test('Unverified contractual pricing fails closed without inventing a token price',()=>{
  const quote=quoteUsage('cohere',{billed_units:{input_tokens:100,output_tokens:20}});
  assert.equal(quote.status,'CONTRACT_RATE_REQUIRED');
  assert.equal(quote.customerQVit,null);
  assert.equal(RATE_CARDS.cohere.rates,null);
});
