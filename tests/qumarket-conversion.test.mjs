import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');

test('Marketplace starts with a short guided purchase instead of the full catalog',()=>{
  assert.match(html,/SECQUOIA Market\./);
  assert.match(html,/id="guidedGoals"/);
  assert.match(html,/data-guided-goal="startup"/);
  assert.match(html,/data-guided-goal="growth"/);
  assert.match(html,/data-guided-goal="regulated"/);
  assert.match(html,/id="guidedRecommendationName"/);
  assert.match(html,/id="guidedChoose"/);
});

test('Marketplace exposes comparable sector and company-size packages',()=>{
  assert.match(html,/id="packageGrid"/);
  assert.match(html,/const packageExamples=\[/);
  assert.match(html,/Finance & health/);
  assert.match(html,/Industry & infrastructure/);
  assert.match(html,/data-add-package/);
  assert.match(html,/function packageTotal/);
});

test('QuCFA estimator is explicit about catalog scope and variable costs',()=>{
  assert.match(html,/id="estimateTier"/);
  assert.match(html,/id="estimateOptions"/);
  assert.match(html,/function renderEstimate/);
  assert.match(html,/No incluye impuestos, onboarding, servicios profesionales ni consumos variables/);
  assert.match(html,/tokens LLM, voz, usuarios, transacciones o conectores/);
  assert.match(html,/QuCFA valida el alcance y tarifario final/);
});

test('Estimator starts from a fixed base bundle and explains optional modules',()=>{
  assert.match(html,/siempre incluido/);
  assert.match(html,/value="quidentify" checked disabled/);
  assert.match(html,/value="qufense" checked disabled/);
  for(const moduleId of ['qusoc','aggy','quhub','qucfa','quoptio']){
    assert.match(html,new RegExp(`value="${moduleId}"`));
  }
  assert.match(html,/equipos distribuidos o regulados/);
  assert.match(html,/soporte e interacci/);
});

test('Estimator governs dependencies and updates the recommendation in place',()=>{
  assert.match(html,/const estimateDependencies=Object\.freeze\(\{qusoc:\['qufense'\],aggy:\['quhub'\],quoptio:\['qucfa'\]\}\)/);
  assert.match(html,/function resolveEstimateDependencies/);
  assert.match(html,/function handleEstimateOptionChange/);
  assert.match(html,/Restablecer recomendaci/);
  assert.match(html,/Seleccionar todo/);
  assert.match(html,/Elegir este plan/);
  assert.match(html,/function addPackage\(id,\{keepTier=false\}=\{\}\)/);
});

test('Advanced controls and catalog remain available without adding initial visual load',()=>{
  assert.match(html,/id="advancedToggle"/);
  assert.match(html,/class="wrap panel estimator market-advanced" id="estimator" hidden/);
  assert.match(html,/class="wrap market-advanced" id="products" hidden/);
  assert.match(html,/function setAdvancedMarketplace/);
  assert.match(html,/document\.querySelectorAll\('\.market-advanced'\)/);
});

test('Aggy explains the recommendation without silently invoking a paid model',()=>{
  assert.match(html,/id="guidedAskAggy"/);
  assert.match(html,/Te recomiendo/);
  assert.match(html,/precio mostrado es orientativo/);
  assert.match(html,/guidedAskAggy'\)\.onclick=.*agentSay/);
});

test('Products and cart are grouped to keep the main decision compact',()=>{
  assert.match(html,/const productGroups=Object\.freeze/);
  assert.match(html,/class="product-group"/);
  assert.match(html,/class="cart-group"/);
  assert.match(html,/grouped modules/);
});

test('Estimate can be saved, restored and exported without personal data',()=>{
  assert.match(html,/id="saveEstimate"/);
  assert.match(html,/id="exportEstimate"/);
  assert.match(html,/function saveEstimate/);
  assert.match(html,/function restoreSavedEstimate/);
  assert.match(html,/function exportEstimate/);
  assert.match(html,/secquoia\.qumarket\.estimate\.v1/);
  assert.match(html,/Estimate exported without personal data/);
});

test('Final review exposes the governed QuIdentify, QuPay and QuDeploy route',()=>{
  assert.match(html,/Ruta gobernada final/);
  assert.match(html,/QuIdentify/);
  assert.match(html,/QuPay/);
  assert.match(html,/QuDeploy/);
  assert.match(html,/Revisar y agregar a la canasta/);
});

test('Guided onboarding is accessible and does not open automatically',()=>{
  assert.match(html,/<dialog class="market-tour" id="marketTour" aria-labelledby="marketTourTitle">/);
  assert.match(html,/data-open-market-tour/);
  assert.match(html,/data-close-market-tour/);
  assert.match(html,/tour\.showModal\(\)/);
  assert.doesNotMatch(html,/marketTour[^;]*\.showModal\(\)/);
});

test('Every rendered module exposes its inclusions',()=>{
  assert.match(html,/class="module-includes"/);
  assert.match(html,/What is included/);
  assert.match(html,/p\.features\.map\(f=>'<li>'\+esc\(f\)/);
  assert.match(html,/p\.license\[l\]/);
});

test('Aggy Marketplace availability matches the bounded GA manifest',()=>{
  assert.match(html,/aggy:\{code:'available',label:\{en:'GA/);
  assert.match(html,/Aggy Core 1\.2\.9 is generally available/);
  assert.match(html,/Preview communication capabilities/);
  assert.doesNotMatch(html,/guided conversational AI RC evaluation/i);
});

test('Available products expose honest status and application requirements',()=>{
  assert.match(html,/Available product modules/);
  assert.match(html,/const productAvailability=Object\.freeze/);
  assert.match(html,/label:\{en:'Available',es:'Disponible'\}/);
  assert.match(html,/label:\{en:'Starter',es:'Starter'\}/);
  assert.match(html,/label:\{en:'Private beta'/);
  assert.match(html,/class="availability-state /);
  assert.match(html,/class="product-requirements"/);
  assert.match(html,/Application requirements/);
  assert.match(html,/availability\.requirements\[l\]\.map/);
});
