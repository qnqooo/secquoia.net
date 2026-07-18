import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');
const bridge=await readFile(new URL('../agenty-marketplace.js',import.meta.url),'utf8');
const css=await readFile(new URL('../agenty-marketplace.css',import.meta.url),'utf8');
const addons=await readFile(new URL('../qumarket-addons.js',import.meta.url),'utf8');
const addonsCss=await readFile(new URL('../qumarket-addons.css',import.meta.url),'utf8');
const intake=await readFile(new URL('../qusoc-universal-intake.js',import.meta.url),'utf8');

test('Agenty advanced marketplace assets have valid JavaScript syntax',()=>{
  const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
  assert.equal(scripts.length,1);
  scripts.forEach(source=>new Function(source));
  new Function(bridge);
  new Function(addons);
  new Function(intake);
  assert.ok(css.includes('.assistant.agenty-full'));
});

test('Agenty restores five advanced areas and responsive full mode',()=>{
  for(const name of ['chat','voice','files','models','security']){
    assert.match(html,new RegExp(`data-market-agenty-tab="${name}"`));
    assert.match(html,new RegExp(`data-market-agenty-panel="${name}"`));
  }
  assert.match(html,/id="assistantFull"/);
  assert.match(html,/data-open-secure-agenty/);
  assert.match(html,/http:\/\/127\.0\.0\.1:8793\//);
});

test('Agenty exposes the approved contextual roles and six languages',()=>{
  for(const role of ['SUPPORT','COMMERCIAL','COO','CISO','CIO','CMO','CFO','PQC_CYBER','AI_TECH','EXECUTIVE_GENERAL'])assert.match(html,new RegExp(`value="${role}"`));
  for(const language of ['EN','ES','FR','DE','IT','PT'])assert.match(html,new RegExp(`value="${language}"`));
  assert.match(html,/advisoryRole:sessionStorage/);
});

test('Agenty advanced inputs remain fail closed',()=>{
  assert.match(html,/function unsafeAgentyInput/);
  assert.match(bridge,/new MediaRecorder/);
  assert.match(intake,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(bridge,/PENDIENTE: antimalware \+ sandbox \+ CDR \+ verificación backend/);
  assert.match(bridge,/LOCAL · SIN PRUEBA E2EE\/PQC/);
  assert.match(html,/El check verde exige validación del motor seguro|check verde exige validación del motor seguro/i);
});

test('QuSOC universal intake cannot authorize QuVault from the browser',()=>{
  assert.match(html,/Compuerta universal de ingreso/);
  assert.match(html,/Sin recibo ADMITTED no hay ingreso/);
  assert.match(html,/src="qusoc-universal-intake\.js"/);
  assert.match(intake,/verdict:'LOCAL_PREFLIGHT'/);
  assert.match(intake,/verdict:'QUARANTINED_PENDING_QUSOC'/);
  assert.match(intake,/admissionAuthorized:false/);
  assert.doesNotMatch(intake,/admissionAuthorized:true/);
  for(const stage of ['quarantine','antimalware','sandbox','cdr','verification'])assert.ok(intake.includes(stage));
  assert.match(bridge,/QuVault DENEGADO/);
});

test('QuSOC browser preflight blocks executables and keeps text outside admission',async()=>{
  const browser={crypto:webcrypto},gate=new Function('window',`${intake};return window.QuSOCIntake`)(browser);
  const file=(name,content,type='text/plain')=>{const bytes=new TextEncoder().encode(content);return {name,type,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(0)}};
  const textReceipt=await gate.inspectLocalText(file('inventory.txt','host-01\n192.0.2.8'));
  assert.equal(textReceipt.verdict,'LOCAL_PREFLIGHT');
  assert.equal(textReceipt.admissionAuthorized,false);
  assert.equal(textReceipt.quvaultAuthorized,false);
  const executable=await gate.preflight(file('payload.exe','MZ malicious','application/octet-stream'));
  assert.equal(executable.verdict,'BLOCKED');
  await assert.rejects(gate.assertAdmission(textReceipt,textReceipt.sanitizedSha256),/admission_required/);
});

test('Agenty markup contains no duplicate element IDs',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
});

test('Agenty voice groups complete ideas without artificial comma pauses',()=>{
  assert.match(html,/length<=460/);
  assert.doesNotMatch(html,/clean\.split\(\/\(\?<=\[,;:\]\)/);
  assert.match(html,/u\.onend=\(\)=>next\(index\+1\)/);
  assert.match(html,/friendly:\{rate:1\.06,pitch:1\.03\}/);
  assert.match(bridge,/friendly:\[1\.06,1\.03\]/);
});

test('Agenty chat exposes one-click collaboration actions',()=>{
  for(const action of ['chat','file','voice','contact','group'])assert.match(html,new RegExp(`data-agenty-quick="${action}"`));
  for(const id of ['agentyStartChat','agentySaveContact','agentyCreateGroup','agentyChatEmail','agentyGroupMembers'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(bridge,/openQuick/);
  assert.match(bridge,/contacts\.push/);
  assert.match(bridge,/groups\.push/);
});

test('QuMarket add-ons expose the hybrid QuCFA commercial model',()=>{
  assert.match(html,/id="addons"/);
  assert.match(html,/id="servicesTotal"/);
  assert.match(html,/qucfa_metric_aware_catalog_and_hybrid_service_rate_card/);
  for(const model of ['per_endpoint_monthly','per_ticket','per_hour','fixed_project'])assert.ok(html.includes(model));
  for(const service of ['qufense-extra-endpoints','human-support-ticket','live-video-support','pqc-architect-hour','qudeploy-connector-project','cloud-onprem-deployment','pqc-readiness-assessment','team-security-workshop','qucfa-economics-workshop'])assert.ok(addons.includes(`id:'${service}'`));
  for(const credit of ['qvit-ai-credit-25','qvit-ai-credit-100','qvit-ai-credit-500'])assert.ok(addons.includes(`id:'${credit}'`));
  assert.match(addons,/ai:\{en:'AI resources',es:'Recursos de IA'\}/);
  assert.match(html,/Included allowance first → purchased credits/);
  assert.match(html,/conserva el checkpoint durante 30 días/);
  assert.match(addons,/HUMAN|availability|disponibilidad/i);
  assert.match(addonsCss,/\.addon-cards/);
});

test('QuMarket cart keeps recurring and one-time service totals separate',()=>{
  assert.match(html,/selectedAddons=new Map/);
  assert.match(html,/monthlyAddons=addonItems\.filter/);
  assert.match(html,/oneTimeServices=addonItems\.filter/);
  assert.match(html,/oneTimeServicesUsd:oneTimeServices/);
  assert.match(html,/totalDueNowUsd:totalDueNow/);
  assert.match(html,/add-ons excluded from discount/);
});

test('QuCFA separates endpoint pricing from service pricing',()=>{
  assert.equal((html.match(/endpoint:true/g)||[]).length,2);
  assert.equal((html.match(/endpoint:false/g)||[]).length,6);
  for(const metric of ['ENDPOINT_TIER_MONTH','TENANT_MONTH','GATEWAY_MONTH','IDENTITY_SERVICE_MONTH','AGENTY_SERVICE_MONTH','WORKSPACE_MONTH','STACK_MONTH'])assert.ok(html.includes(metric));
  assert.match(html,/billingModel\(p\)\.endpoint\?endpointMultipliers\[tier\(\)\]:1/);
  assert.match(html,/serviceMultiplier:1/);
  assert.doesNotMatch(html,/flatMultiplier/);
  assert.match(html,/marginStatus:'UNVERIFIED_NO_COST_RATE_CARD'/);
  assert.match(html,/\['Producto','Medición','Alcance','Variable adicional','Tarifa base'/);
  assert.match(html,/function orderNeedsConsult\(\).*billingModel\(p\)\.endpoint/);
});
