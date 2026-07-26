import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html=await readFile(new URL('../qu-market.html',import.meta.url),'utf8');

test('Marketplace hero explains what it is, who it serves and what it solves',()=>{
  assert.match(html,/Ciberseguridad modular para operar con confianza/);
  assert.match(html,/>Qué es<\/strong>/);
  assert.match(html,/>Para quién<\/strong>/);
  assert.match(html,/>Qué resuelve<\/strong>/);
});

test('Marketplace exposes comparable sector and company-size packages',()=>{
  assert.match(html,/id="packageGrid"/);
  assert.match(html,/const packageExamples=\[/);
  assert.match(html,/Finance & health · 100 endpoints/);
  assert.match(html,/Industry & infrastructure · 250 endpoints/);
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
  assert.match(html,/Bundle base · siempre incluido/);
  assert.match(html,/value="quidentify" checked disabled/);
  assert.match(html,/value="qufense" checked disabled/);
  for(const moduleId of ['qusoc','aggy','quhub','qucfa','quoptio']){
    assert.match(html,new RegExp(`value="${moduleId}"`));
  }
  assert.match(html,/Conviene a equipos distribuidos o regulados/);
  assert.match(html,/Útil para adopción, soporte e interacción ejecutiva/);
});

test('Estimator governs dependencies and updates the recommendation in place',()=>{
  assert.match(html,/const estimateDependencies=Object\.freeze\(\{qusoc:\['qufense'\],aggy:\['quhub'\],quoptio:\['qucfa'\]\}\)/);
  assert.match(html,/function resolveEstimateDependencies/);
  assert.match(html,/function handleEstimateOptionChange/);
  assert.match(html,/Restablecer recomendación/);
  assert.match(html,/Seleccionar todo/);
  assert.match(html,/Usar en el estimador/);
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
  assert.match(html,/<b>1 · QuIdentify<\/b>/);
  assert.match(html,/<b>2 · QuPay<\/b>/);
  assert.match(html,/<b>3 · QuDeploy<\/b>/);
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
  assert.match(html,/Qué incluye/);
  assert.match(html,/p\.features\.map\(f=>'<li>'\+esc\(f\)/);
  assert.match(html,/p\.license\[l\]/);
});

test('Available products expose honest status and application requirements',()=>{
  assert.match(html,/>Productos disponibles<\/h2>/);
  assert.match(html,/const productAvailability=Object\.freeze/);
  assert.match(html,/label:\{en:'Available',es:'Disponible'\}/);
  assert.match(html,/label:\{en:'Starter',es:'Starter'\}/);
  assert.match(html,/label:\{en:'Private beta',es:'Beta privada'\}/);
  assert.match(html,/class="availability-state /);
  assert.match(html,/class="product-requirements"/);
  assert.match(html,/Requisitos para solicitar/);
  assert.match(html,/availability\.requirements\[l\]\.map/);
  assert.match(html,/\?\s*'Solicitar':'Request'/);
});
