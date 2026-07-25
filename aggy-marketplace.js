(()=>{
  'use strict';
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const assistant=$('#assistant'),full=$('#assistantFull'),agentState=$('#agentState'),conversation=$('#conversation');
  if(!assistant||!full)return;
  const runtimeOrigin='http://127.0.0.1:8793';
  const setPanel=name=>{
    $$('[data-market-aggy-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.marketAggyPanel===name));
    $$('[data-market-aggy-tab]').forEach(button=>button.classList.toggle('active',button.dataset.marketAggyTab===name));
  };
  $$('[data-market-aggy-tab]').forEach(button=>button.addEventListener('click',()=>setPanel(button.dataset.marketAggyTab)));
  full.addEventListener('click',event=>{event.stopPropagation();assistant.classList.toggle('aggy-full');full.textContent=assistant.classList.contains('aggy-full')?'↙':'↗';full.setAttribute('aria-label',assistant.classList.contains('aggy-full')?'Reducir Aggy':'Expandir Aggy')});

  const markLocalMessages=()=>$$('#conversation .msg:not([data-proof])').forEach(message=>{message.dataset.proof='local';const proof=document.createElement('span');proof.className='aggy-proof';proof.textContent='LOCAL · SIN PRUEBA E2EE/PQC';message.append(proof)});
  markLocalMessages();new MutationObserver(markLocalMessages).observe(conversation,{childList:true});

  const contacts=[],groups=[],emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,quickSheet=$('#aggyQuickSheet');let pendingPeerEmail='';
  const identityVerified=()=>localStorage.getItem('secquoia.qumarket.quidentifyVerified')==='true';
  const renderMemoryList=(root,items,label)=>{root.replaceChildren();for(const item of items){const chip=document.createElement('span');chip.textContent=label(item);root.append(chip)}};
  const openQuick=action=>{
    if(action==='file'){setPanel('files');setTimeout(()=>$('#aggyFile')?.click(),0);return}
    if(action==='voice'){setPanel('voice');setTimeout(()=>$('#aggyVoiceRecord')?.click(),0);return}
    const titles={chat:'Iniciar chat con un colega',contact:'Crear contacto',group:'Crear grupo'};quickSheet.classList.remove('hidden');$('#aggyQuickTitle').textContent=titles[action]||'Aggy';$$('[data-aggy-quick-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.aggyQuickPanel===action));assistant.classList.add('aggy-full');full.textContent='↙';
  };
  $$('[data-aggy-quick]').forEach(button=>button.addEventListener('click',()=>openQuick(button.dataset.aggyQuick)));
  $('#aggyQuickClose')?.addEventListener('click',()=>quickSheet.classList.add('hidden'));
  $('#aggyStartChat')?.addEventListener('click',()=>{const email=$('#aggyChatEmail').value.trim().toLowerCase(),state=$('#aggyChatState');if(!emailPattern.test(email)){state.textContent='× Introduce un correo válido.';state.className='aggy-note blocked';return}if(!identityVerified()){state.textContent='× Debes verificar tu identidad con QuIdentify/Okta antes de iniciar el chat.';state.className='aggy-note blocked';return}pendingPeerEmail=email;state.textContent=`Validación solicitada para ${email}. El motor seguro confirmará si pertenece al ecosistema.`;state.className='aggy-note ready';setTimeout(openSecure,250)});
  $('#aggySaveContact')?.addEventListener('click',()=>{const name=$('#aggyContactName').value.trim(),email=$('#aggyContactEmail').value.trim().toLowerCase(),state=$('#aggyContactState');if(!identityVerified()){state.textContent='× QuIdentify/Okta debe estar verificado.';state.className='aggy-note blocked';return}if(!name||!emailPattern.test(email)){state.textContent='× Nombre o correo inválido.';state.className='aggy-note blocked';return}if(!contacts.some(contact=>contact.email===email))contacts.push({name,email});renderMemoryList($('#aggyContactList'),contacts,contact=>`${contact.name} · ${contact.email}`);state.textContent='✓ Contacto creado en memoria. La habilitación de chat exige validación del backend.';state.className='aggy-note ready'});
  $('#aggyCreateGroup')?.addEventListener('click',()=>{const name=$('#aggyGroupName').value.trim(),members=$('#aggyGroupMembers').value.split(/[;,\n]+/).map(value=>value.trim().toLowerCase()).filter(Boolean),state=$('#aggyGroupState'),unique=[...new Set(members)];if(!identityVerified()){state.textContent='× QuIdentify/Okta debe estar verificado.';state.className='aggy-note blocked';return}if(!name||unique.length<2||unique.some(email=>!emailPattern.test(email))){state.textContent='× Indica un nombre y al menos dos correos válidos.';state.className='aggy-note blocked';return}groups.push({name,members:unique});renderMemoryList($('#aggyGroupList'),groups,group=>`${group.name} · ${group.members.length} miembros`);state.textContent='✓ Grupo creado en memoria. Cada miembro será validado por el backend antes del chat real.';state.className='aggy-note ready'});

  const startAggyVoice=()=>{setPanel('voice');const state=$('#aggyVoiceState');if(!window.AggyVoice){state.textContent='Aggy Voice todavía se está preparando. Intenta nuevamente en un momento.';return}state.textContent='Iniciando conversación bidireccional con Aggy Voice…';window.AggyVoice.start()};
  $('#aggyVoiceTalk')?.addEventListener('click',startAggyVoice);
  $('#aggyVoiceRecord')?.addEventListener('click',startAggyVoice);
  $('#aggyVoiceRead')?.addEventListener('click',()=>{const messages=$$('#conversation .msg.agent'),text=messages.at(-1)?.childNodes[0]?.textContent||messages.at(-1)?.textContent||'',state=$('#aggyVoiceState');if(!text){state.textContent='No existe una respuesta de Aggy para leer.';return}if(!window.AggyVoice){state.textContent='Aggy Voice todavía se está preparando. Intenta nuevamente en un momento.';return}state.textContent='Aggy leerá la última respuesta con su voz Realtime.';window.AggyVoice.readAloud(text)});
  $('#aggyPersonality')?.addEventListener('change',event=>{localStorage.setItem('secquoia.aggy.personality',event.target.value);$('#aggyVoiceState').textContent='Preferencia de voz actualizada. No modifica la autoridad ni activa proveedores externos.'});

  const inspectFile=async()=>{const input=$('#aggyFile'),output=$('#aggyFileState'),file=input.files?.[0];if(!file){output.className='aggy-result blocked';output.textContent='BLOQUEADO · seleccione un archivo.';return}if(!window.QuSOCIntake){output.className='aggy-result blocked';output.textContent='BLOQUEADO · compuerta QuSOC no disponible.';return}const receipt=await window.QuSOCIntake.preflight(file),hash=receipt.originalSha256||'no calculado';if(receipt.verdict==='BLOCKED'){output.className='aggy-result blocked';output.textContent=`BLOQUEADO Y EN CUARENTENA · ${receipt.reason} · SHA-256 ${hash} · no ingresó al ecosistema`;return}output.className='aggy-result checking';output.textContent=`CUARENTENA ACTIVA · ${file.name} · ${file.size} bytes · SHA-256 ${hash} · PENDIENTE: antimalware + sandbox + CDR + verificación backend · QuVault DENEGADO`};
  $('#aggyInspectFile')?.addEventListener('click',()=>inspectFile().catch(()=>{const output=$('#aggyFileState');output.className='aggy-result blocked';output.textContent='BLOQUEADO · no fue posible inspeccionar el archivo.'}));

  const modelEndpoint='https://quhub.secquoia.group/v1/llm/catalog';
  const refreshModelCatalog=async()=>{
    const badge=$('#aggyModelsBadge');
    try{
      const response=await fetch(modelEndpoint,{cache:'no-store',signal:AbortSignal.timeout(5000)}),data=await response.json();
      if(!response.ok||!Array.isArray(data.providers))throw new Error('catalog_unavailable');
      let available=0;
      for(const provider of data.providers){
        const button=$(`[data-aggy-provider="${provider.id}"]`);
        if(!button)continue;
        button.dataset.available=provider.available?'true':'false';
        const pricing=provider.pricing?.status==='VERIFIED_PUBLIC_RATE_CARD'?'tarifa verificada':'tarifa contractual';
        button.querySelector('small').textContent=`${provider.model} · ${provider.available?'disponible':'sin credencial'} · ${pricing}`;
        if(provider.available)available++;
      }
      badge.className=`aggy-state ${available?'ready':'blocked'}`;
      badge.textContent=available?`${available} DISPONIBLE${available===1?'':'S'}`:'SIN PROVEEDOR';
    }catch{
      badge.className='aggy-state blocked';badge.textContent='QUHUB NO DISPONIBLE';
      $$('[data-aggy-provider]:not([data-aggy-provider="sqaile"]) small').forEach(label=>label.textContent='Estado no verificado');
    }
  };
  const contextualUpdate=()=>{const role=$('#aggyRole')?.value||'SUPPORT',language=$('#aggyLanguage')?.value||'AUTO';sessionStorage.setItem('secquoia.aggy.role',role);sessionStorage.setItem('secquoia.aggy.language',language);const provider=sessionStorage.getItem('secquoia.aggy.provider')||'sqaile';$('#aggyContextState').textContent=`${language} · ${role} · ${provider==='sqaile'?'SQAILE Core orquesta':'selección manual: '+provider}`;agentState.textContent=`Aggy · ${role} · ${language}`};
  $('#aggyRole')?.addEventListener('change',contextualUpdate);$('#aggyLanguage')?.addEventListener('change',contextualUpdate);
  $$('[data-aggy-mode]').forEach(button=>button.addEventListener('click',()=>{$$('[data-aggy-mode]').forEach(item=>item.classList.toggle('active',item===button));sessionStorage.setItem('secquoia.aggy.taskMode',button.dataset.aggyMode);contextualUpdate()}));
  $$('[data-aggy-provider]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.aggyProvider!=='sqaile'&&button.dataset.available!=='true'){$('#aggyContextState').textContent=`${button.textContent.trim()} no está habilitado: agrega su secreto en QuHub.`;return}const provider=button.dataset.aggyProvider,label=provider==='sqaile'?'SQAILE Core (puede seleccionar proveedores de pago)':button.childNodes[0]?.textContent?.trim()||provider;if(!confirm(`Activar ${label} puede consumir saldo QVit y generar costos adicionales del proveedor. QuCFA los calculará con el tarifario vigente. ¿Continuar?`))return;$$('[data-aggy-provider]').forEach(item=>item.classList.toggle('selected',item===button));sessionStorage.setItem('secquoia.aggy.provider',provider);sessionStorage.setItem('secquoia.aggy.qvitCostAcknowledged','true');contextualUpdate()}));

  $('#aggyInvite')?.addEventListener('click',()=>{const state=$('#aggyInviteState'),from=$('#aggyInviteFrom').value.trim().toLowerCase(),to=$('#aggyInviteTo').value.trim().toLowerCase(),email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;if(!email.test(from)||!email.test(to)||from===to){state.className='blocked';state.textContent='× Correos inválidos o idénticos.';return}if(localStorage.getItem('secquoia.qumarket.quidentifyVerified')!=='true'){state.className='blocked';state.textContent='× QuIdentify/Okta no está verificado. No se envió invitación.';return}state.className='ready';state.textContent=`Solicitud preparada para ${to}. La invitación real requiere el backend Aggy y validación QuIdentify del destinatario.`});

  const probe=async()=>{const badge=$('#aggyRuntimeState');badge.className='aggy-state checking';badge.textContent='VERIFICANDO';try{const response=await fetch(`${runtimeOrigin}/ready`,{cache:'no-store',signal:AbortSignal.timeout(3500)}),body=await response.json();if(!response.ok)throw new Error(body.productionStatus||body.status||'BLOCKED');badge.className='aggy-state ready';badge.textContent='MOTOR LOCAL LISTO'}catch(error){badge.className='aggy-state blocked';badge.textContent='MOTOR NO VERIFICADO';agentState.textContent='Aggy seguro no disponible · modo local'}return badge.classList.contains('ready')};
  $('#aggyProbeRuntime')?.addEventListener('click',probe);
  function openSecure(){assistant.classList.add('aggy-full');full.textContent='↙';setPanel('security');const wrap=$('#aggySecureFrameWrap'),frame=$('#aggySecureFrame');wrap.classList.remove('hidden');if(pendingPeerEmail)frame.dataset.pendingPeer='validated-by-backend-required';if(!frame.getAttribute('src'))frame.setAttribute('src',frame.dataset.src)}
  $$('[data-open-secure-aggy]').forEach(button=>button.addEventListener('click',openSecure));
  $('#aggyCloseSecure')?.addEventListener('click',()=>$('#aggySecureFrameWrap').classList.add('hidden'));
  const savedProvider=sessionStorage.getItem('secquoia.aggy.provider')||'sqaile';
  $$('[data-aggy-provider]').forEach(button=>button.classList.toggle('selected',button.dataset.aggyProvider===savedProvider));
  contextualUpdate();refreshModelCatalog();
})();
