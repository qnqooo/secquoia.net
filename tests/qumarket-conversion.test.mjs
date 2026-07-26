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
