const $=selector=>document.querySelector(selector);
const state={
  step:1,
  apiBase:new URLSearchParams(location.search).get('api')||'https://pki.secquoia.group',
  identityVerified:new URLSearchParams(location.search).get('quidentify')==='verified',
  apiReady:false,
  csr:null,
  request:null
};
const PEM=/^-----BEGIN (?:NEW )?CERTIFICATE REQUEST-----[\s\S]+-----END (?:NEW )?CERTIFICATE REQUEST-----$/;
const hex=buffer=>[...new Uint8Array(buffer)].map(value=>value.toString(16).padStart(2,'0')).join('');
const lang=()=>document.body.classList.contains('es')?'es':'en';
const message=(en,es)=>lang()==='es'?es:en;

function setStep(next){
  state.step=Math.max(1,Math.min(5,next));
  document.querySelectorAll('.screen').forEach(node=>node.classList.toggle('active',Number(node.dataset.screen)===state.step));
  document.querySelectorAll('.step').forEach(node=>{
    const number=Number(node.dataset.step);
    node.classList.toggle('active',number===state.step);
    node.classList.toggle('complete',number<state.step);
  });
  scrollTo({top:document.querySelector('.workspace').offsetTop-90,behavior:'smooth'});
}

function setGate(id,status,label){
  const gate=document.getElementById(id);
  gate.classList.remove('ok','bad');
  if(status===true)gate.classList.add('ok');
  if(status===false)gate.classList.add('bad');
  gate.querySelector('b').textContent=label;
}

async function probeApi(){
  setGate('apiGate',null,'CHECKING');
  try{
    const response=await fetch(`${state.apiBase}/health`,{headers:{accept:'application/json'},cache:'no-store'});
    state.apiReady=response.ok;
    setGate('apiGate',response.ok,response.ok?'AVAILABLE':'BLOCKED');
  }catch{
    state.apiReady=false;
    setGate('apiGate',false,'UNAVAILABLE');
  }
  $('#apiEndpoint').textContent=state.apiBase.replace(/^https?:\/\//,'');
}

async function inspectCsr(){
  const text=$('#csr').value.trim(),result=$('#csrResult');
  result.className='result';
  if(text.length<100||text.length>131072||!PEM.test(text)){
    state.csr=null;result.classList.add('bad');
    result.textContent=message('CSR rejected: use a PEM PKCS#10 request between 100 bytes and 128 KiB.','CSR rechazado: usa una solicitud PKCS#10 PEM entre 100 bytes y 128 KiB.');
    $('#submitRequest').disabled=true;return;
  }
  const digest=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
  state.csr={pem:text,sha256:digest,bytes:new TextEncoder().encode(text).length};
  result.classList.add('ok');
  result.innerHTML=`<strong>${message('CSR accepted locally','CSR aceptado localmente')}</strong><pre>SHA-256  ${digest}\nBytes     ${state.csr.bytes}\nPrivate key received  false</pre>`;
  $('#submitRequest').disabled=!(state.identityVerified&&state.apiReady);
}

async function submitRequest(){
  if(!state.csr||!state.identityVerified||!state.apiReady)return;
  const idempotencyKey=crypto.randomUUID();
  const payload={
    schema:'secquoia.qupkiaas.certificate-request.v1',
    profile:$('#profile').value,
    commonName:$('#commonName').value.trim(),
    validityDays:Number($('#validity').value),
    certificateRequest:state.csr.pem,
    csrSha256:state.csr.sha256,
    delivery:'PORTAL_AND_API_PUBLIC_MATERIAL_ONLY',
    privateKeyProvided:false
  };
  $('#submitRequest').disabled=true;
  try{
    const response=await fetch(`${state.apiBase}/v1/certificates/requests`,{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json','idempotency-key':idempotencyKey},
      credentials:'include',
      body:JSON.stringify(payload)
    });
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||`HTTP_${response.status}`);
    state.request=body;
    $('#requestReceipt').textContent=JSON.stringify({
      requestId:body.requestId,
      state:body.state,
      csrSha256:state.csr.sha256,
      privateKeyReceived:false
    },null,2);
    setStep(4);
  }catch(error){
    const result=$('#csrResult');result.className='result bad';
    result.textContent=message(`Issuance blocked: ${error.message}`,`Emisión bloqueada: ${error.message}`);
  }finally{$('#submitRequest').disabled=false}
}

async function refreshStatus(){
  if(!state.request?.requestId)return;
  try{
    const response=await fetch(`${state.apiBase}/v1/certificates/requests/${encodeURIComponent(state.request.requestId)}`,{credentials:'include',headers:{accept:'application/json'}});
    const body=await response.json();
    if(!response.ok)throw new Error(body.error||`HTTP_${response.status}`);
    state.request={...state.request,...body};
    $('#requestReceipt').textContent=JSON.stringify(body,null,2);
    if(body.state==='ISSUED'){setStep(5);$('#downloadCertificate').disabled=false}
  }catch(error){$('#requestReceipt').textContent=message(`Status unavailable: ${error.message}`,`Estado no disponible: ${error.message}`)}
}

async function downloadCertificate(){
  if(!state.request?.requestId)return;
  const response=await fetch(`${state.apiBase}/v1/certificates/requests/${encodeURIComponent(state.request.requestId)}/certificate`,{credentials:'include',headers:{accept:'application/x-pem-file'}});
  if(!response.ok){$('#deliveryResult').textContent=message('Certificate delivery blocked.','Entrega del certificado bloqueada.');return}
  const blob=await response.blob(),url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=`qupkiaas-${state.request.requestId}.pem`;anchor.click();URL.revokeObjectURL(url);
  $('#deliveryResult').textContent=message('Public certificate downloaded. The private key never entered QuPKIaaS.','Certificado público descargado. La clave privada nunca ingresó a QuPKIaaS.');
}

function downloadManifest(){
  const manifest={
    schema:'secquoia.qudeploy.qupkiaas-onboarding.v1',
    createdAt:new Date().toISOString(),
    apiBase:state.apiBase,
    certificateRequest:state.request?{requestId:state.request.requestId,state:state.request.state}:null,
    csr:state.csr?{sha256:state.csr.sha256,bytes:state.csr.bytes,rawStored:false}:null,
    gates:{quidentify:state.identityVerified,api:state.apiReady,qufense:'REQUIRED_SERVER_SIDE',quaudit:'REQUIRED_SERVER_SIDE'},
    keyCustody:'CUSTOMER_HSM_KMS_OR_DEVICE_NON_EXPORTABLE',
    privateKeyTransferred:false
  };
  const blob=new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download='qupkiaas-qudeploy-manifest.json';anchor.click();URL.revokeObjectURL(url);
}

document.querySelectorAll('[data-next]').forEach(button=>button.onclick=()=>setStep(Number(button.dataset.next)));
document.querySelectorAll('[data-prev]').forEach(button=>button.onclick=()=>setStep(Number(button.dataset.prev)));
$('#inspectCsr').onclick=inspectCsr;
$('#submitRequest').onclick=submitRequest;
$('#refreshStatus').onclick=refreshStatus;
$('#downloadCertificate').onclick=downloadCertificate;
$('#downloadManifest').onclick=downloadManifest;
$('#identify').onclick=()=>{location.href=`https://quidentify.secquoia.group/v1/authorize?client=qupkiaas-portal&purpose=certificate_issuance&return_uri=${encodeURIComponent(location.origin+location.pathname+'?quidentify=verified')}`};
$('#en').onclick=()=>{document.body.classList.remove('es');localStorage.setItem('secquoia.lang','en')};
$('#es').onclick=()=>{document.body.classList.add('es');localStorage.setItem('secquoia.lang','es')};
if((localStorage.getItem('secquoia.lang')||navigator.language).toLowerCase().startsWith('es'))document.body.classList.add('es');
setGate('identityGate',state.identityVerified,state.identityVerified?'VERIFIED':'REQUIRED');
setGate('keyGate',true,'CUSTOMER CUSTODY');
probeApi();
