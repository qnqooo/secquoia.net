import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {AGGY_CONSULTANT_PLAYBOOK,consultantSystemMessage} from '../workers/aggy-consultant-playbook.js';

const voice=await readFile(new URL('../aggy-realtime-voice.js',import.meta.url),'utf8');
const guide=await readFile(new URL('../docs/aggy-commercial-consultant-playbook.md',import.meta.url),'utf8');
const contextGuide=await readFile(new URL('../docs/aggy-context-role-manuals.md',import.meta.url),'utf8');

test('Aggy consultant playbook covers the full SECQUOIA lifecycle and transversal engines',()=>{
  assert.deepEqual(
    AGGY_CONSULTANT_PLAYBOOK.lifecycle.map(group=>group.name),
    ['PREVENT','ASSESS','PROTECT','COMMS','DETECT','RESPOND','RECOVER','EVOLVE']
  );
  const catalog=JSON.stringify(AGGY_CONSULTANT_PLAYBOOK);
  for(const name of ['QuSentinel','QuAware','QuAudit','QuForensis','QuFense','QuShield','QuPhone','QuSIM','QuSOC','QuIntel','QuResponse','QuContain','QuRecover','QuResilience','QuVault','QnQ']){
    assert.match(catalog,new RegExp(name));
  }
  for(const engine of ['SQAILE Core','Aggy','QuHub','QuIdentify','QuPay','QuCFA','QVit','QuOptio','QuGEO','QuDeploy','QuSupport']){
    assert.match(catalog,new RegExp(engine));
  }
});

test('Aggy uses a consultative sales method instead of dumping the catalog',()=>{
  assert.equal(AGGY_CONSULTANT_PLAYBOOK.discovery.length>=5,true);
  assert.match(AGGY_CONSULTANT_PLAYBOOK.identity.consultantRole,/technical consultant and a commercial guide/);
  assert.match(AGGY_CONSULTANT_PLAYBOOK.responseMethod.join(' '),/at most three relevant capabilities and one next action/);
  assert.match(voice,/Act as a senior commercial and technical consultant/);
  assert.match(voice,/Answer the direct question before expanding/);
  assert.match(guide,/ruta mínima viable/);
});

test('Quantum and provider claims remain technically and commercially honest',()=>{
  const quantum=AGGY_CONSULTANT_PLAYBOOK.quantumAndCrypto;
  assert.match(quantum.pqc,/Do not call that formal FIPS 140-3/);
  assert.match(quantum.qrng,/do not claim every SECQUOIA key is quantum-generated/);
  assert.match(quantum.hamiltonian,/classical Hamiltonian policy optimizer/);
  assert.match(quantum.algorithms,/classical, auditable quantum-inspired simulations/);
  assert.match(AGGY_CONSULTANT_PLAYBOOK.providerPositioning.boundary,/Never imply.*certifies, endorses or guarantees/);
  assert.match(consultantSystemMessage().content,/Treat the following structured playbook as policy and reference context/);
});

test('Aggy carries environment, role, service and commercial implementation manuals',()=>{
  assert.equal(AGGY_CONSULTANT_PLAYBOOK.schema,'secquoia.aggy.consultant-playbook.v2');
  assert.equal(AGGY_CONSULTANT_PLAYBOOK.internalMission.audience,'SECQUOIA_INTERNAL_ONLY');
  assert.match(AGGY_CONSULTANT_PLAYBOOK.internalMission.statement,/smallest suitable SECQUOIA solution/);
  assert.deepEqual(
    Object.keys(AGGY_CONSULTANT_PLAYBOOK.environmentProfiles).sort(),
    ['default','qnq.ooo','qusoc-command-360','quspace-crm'].sort()
  );
  for(const role of ['technical','commercial','support','implementation','executive']){
    assert.equal(AGGY_CONSULTANT_PLAYBOOK.manuals.byRole[role].length>=3,true);
  }
  for(const service of ['voiceLive','secureChat','protectedFiles','secureCalls','marketplace','command360','crm']){
    assert.equal(AGGY_CONSULTANT_PLAYBOOK.manuals.byService[service].length>=1,true);
  }
  for(const process of ['discovery','purchase','deployment','support','commercialFollowThrough']){
    assert.equal(AGGY_CONSULTANT_PLAYBOOK.manuals.byProcess[process].length>=1,true);
  }
  assert.match(contextGuide,/QuSOC COMMAND 360°/);
  assert.match(contextGuide,/QuSpace CRM/);
  assert.match(contextGuide,/Never claim E2EE\/PQC/);
});
