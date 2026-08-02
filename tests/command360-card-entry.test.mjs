import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('QuSOC hero card launches the protected COMMAND 360 surface',()=>{
  assert.match(html,/<a class="panel command360-launch" href="https:\/\/qusoc\.secquoia\.group\/admin"/);
  assert.doesNotMatch(html,/<a class="panel command360-launch"[^>]+target="_blank"/);
  assert.match(html,/aria-label="Abrir QuSOC COMMAND 360° con acceso seguro"/);
  assert.match(html,/Acceso seguro a COMMAND 360°/);
});

test('COMMAND 360 uses same-tab navigation so embedded browsers do not leave a blank popup',()=>{
  const launcher=html.match(/<a class="panel command360-launch"[^>]+>/)?.[0]||'';
  assert.match(launcher,/href="https:\/\/qusoc\.secquoia\.group\/admin"/);
  assert.doesNotMatch(launcher,/target=/);
  assert.doesNotMatch(launcher,/window\.open/);
});

test('COMMAND 360 card exposes keyboard focus and interaction affordances',()=>{
  assert.match(html,/\.command360-launch:focus-visible\{outline:3px solid #fff/);
  assert.match(html,/\.command360-launch\{display:block;cursor:pointer/);
});
