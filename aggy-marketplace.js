(()=>{
  'use strict';
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const assistant=$('#assistant'),full=$('#assistantFull'),agentState=$('#agentState'),conversation=$('#conversation');
  if(!assistant||!full)return;
  if(window.parent!==window)window.parent.postMessage({type:'secquoia:aggy:frame-ready',version:'1.2.5'},'*');
  const runtimeOrigin='http://127.0.0.1:8793';
  const appGrid=$('#aggyAppGrid'),gridToggle=$('#aggyGridToggle');
  const setGrid=open=>{
    if(!appGrid||!gridToggle)return;
    appGrid.classList.toggle('hidden',!open);
    gridToggle.setAttribute('aria-expanded',String(open));
    gridToggle.classList.toggle('active',open);
  };
  const setPanel=name=>{
    setGrid(false);
    $$('[data-market-aggy-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.marketAggyPanel===name));
    $$('.aggy-tabs [data-open-aggy-panel]').forEach(button=>button.classList.toggle('active',button.dataset.openAggyPanel===name));
  };
  gridToggle?.addEventListener('click',()=>setGrid(appGrid?.classList.contains('hidden')??false));
  $('#aggyGridClose')?.addEventListener('click',()=>setGrid(false));
  $$('[data-chat-menu]').forEach(button=>button.addEventListener('click',()=>setGrid(true)));
  const composerInput=$('#agentInput'),composerSend=$('#send');
  const syncComposerAction=()=>{
    const hasMessage=Boolean(composerInput?.value.trim());
    if(composerSend)composerSend.hidden=!hasMessage;
  };
  composerInput?.addEventListener('input',syncComposerAction);
  syncComposerAction();
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setGrid(false)});
  $$('[data-open-aggy-panel]').forEach(button=>button.addEventListener('click',()=>setPanel(button.dataset.openAggyPanel)));
  full.addEventListener('click',event=>{event.stopPropagation();assistant.classList.toggle('aggy-full');full.textContent=assistant.classList.contains('aggy-full')?'↙':'↗';full.setAttribute('aria-label',assistant.classList.contains('aggy-full')?'Reducir Aggy':'Expandir Aggy')});

  const markLocalMessages=()=>$$('#conversation .msg:not([data-proof])').forEach(message=>{message.dataset.proof='local';const proof=document.createElement('span');proof.className='aggy-proof';proof.textContent='LOCAL · SIN PRUEBA E2EE/PQC';message.append(proof)});
  markLocalMessages();new MutationObserver(markLocalMessages).observe(conversation,{childList:true});

  const contacts=[],groups=[],emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,quickSheet=$('#aggyQuickSheet');let pendingPeerEmail='',callKind='individual',callMedia='audio',callReceipt=null;
  const identityVerified=()=>localStorage.getItem('secquoia.qumarket.quidentifyVerified')==='true';
  const initials=name=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'A';
  const renderMemoryList=(root,items,label)=>{if(!root)return;root.replaceChildren();for(const item of items){const chip=document.createElement('span');chip.textContent=label(item);root.append(chip)}};
  const personRow=(title,detail,action)=>{
    const row=document.createElement('article'),avatar=document.createElement('span'),copy=document.createElement('p'),strong=document.createElement('strong'),small=document.createElement('small'),button=document.createElement('button');
    row.className='aggy-person';avatar.className='aggy-person-avatar';avatar.textContent=initials(title);strong.textContent=title;small.textContent=detail;copy.append(strong,small);button.type='button';button.textContent=action;row.append(avatar,copy,button);return {row,button};
  };
  const renderCommunicationData=()=>{
    const contactQuery=$('#aggyContactSearch')?.value.trim().toLowerCase()||'',groupQuery=$('#aggyGroupSearch')?.value.trim().toLowerCase()||'',contactRoot=$('#aggyContactsDirectory'),groupRoot=$('#aggyGroupsDirectory');
    if(contactRoot){
      contactRoot.replaceChildren();
      const visible=contacts.filter(contact=>`${contact.name} ${contact.email}`.toLowerCase().includes(contactQuery));
      if(!visible.length){const empty=document.createElement('p');empty.className='aggy-empty';empty.textContent=contacts.length?'No hay coincidencias.':'Aún no hay contactos en esta sesión. Crea uno para preparar una conversación.';contactRoot.append(empty)}
      for(const contact of visible){const {row,button}=personRow(contact.name,contact.email,'Llamar');button.addEventListener('click',()=>{setPanel('calls');callKind='individual';syncCallControls();$('#aggyCallPeer').value=contact.email;resetCallReadiness('Destino actualizado. Verifica nuevamente la ruta E2EE/PQC.')});contactRoot.append(row)}
    }
    if(groupRoot){
      groupRoot.replaceChildren();
      const visible=groups.filter(group=>`${group.name} ${group.members.join(' ')}`.toLowerCase().includes(groupQuery));
      if(!visible.length){const empty=document.createElement('p');empty.className='aggy-empty';empty.textContent=groups.length?'No hay coincidencias.':'Aún no hay grupos en esta sesión. Agrega al menos dos miembros verificados.';groupRoot.append(empty)}
      for(const group of visible){const {row,button}=personRow(group.name,`${group.members.length} miembros`,'Llamar');button.addEventListener('click',()=>{setPanel('calls');callKind='group';syncCallControls();$('#aggyCallGroup').value=group.name;resetCallReadiness('Grupo actualizado. Verifica nuevamente la ruta E2EE/PQC.')});groupRoot.append(row)}
    }
    const peer=$('#aggyCallPeer'),groupSelect=$('#aggyCallGroup');
    if(peer){const selected=peer.value;peer.replaceChildren(new Option('Selecciona un contacto',''),...contacts.map(contact=>new Option(`${contact.name} · ${contact.email}`,contact.email)));peer.value=selected}
    if(groupSelect){const selected=groupSelect.value;groupSelect.replaceChildren(new Option('Selecciona un grupo',''),...groups.map(group=>new Option(`${group.name} · ${group.members.length} miembros`,group.name)));groupSelect.value=selected}
  };
  const openQuick=action=>{
    if(action==='file'){setPanel('files');$('#aggyFile')?.click();return}
    if(action==='voice'){setPanel('voice');setTimeout(()=>$('#aggyVoiceRecord')?.click(),0);return}
    setPanel('chat');
    const titles={chat:'Iniciar chat con un colega',contact:'Crear contacto',group:'Crear grupo'};quickSheet.classList.remove('hidden');$('#aggyQuickTitle').textContent=titles[action]||'Aggy';$$('[data-aggy-quick-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.aggyQuickPanel===action));assistant.classList.add('aggy-full');full.textContent='↙';
  };
  $$('[data-aggy-quick]').forEach(button=>button.addEventListener('click',()=>openQuick(button.dataset.aggyQuick)));
  $('#aggyQuickClose')?.addEventListener('click',()=>quickSheet.classList.add('hidden'));
  $('#aggyStartChat')?.addEventListener('click',()=>{const email=$('#aggyChatEmail').value.trim().toLowerCase(),state=$('#aggyChatState');if(!emailPattern.test(email)){state.textContent='× Introduce un correo válido.';state.className='aggy-note blocked';return}if(!identityVerified()){state.textContent='× Debes verificar tu identidad con QuIdentify/Okta antes de iniciar el chat.';state.className='aggy-note blocked';return}pendingPeerEmail=email;state.textContent=`Validación solicitada para ${email}. El motor seguro confirmará si pertenece al ecosistema.`;state.className='aggy-note ready';setTimeout(openSecure,250)});
  $('#aggySaveContact')?.addEventListener('click',()=>{const name=$('#aggyContactName').value.trim(),email=$('#aggyContactEmail').value.trim().toLowerCase(),state=$('#aggyContactState');if(!identityVerified()){state.textContent='× QuIdentify/Okta debe estar verificado.';state.className='aggy-note blocked';return}if(!name||!emailPattern.test(email)){state.textContent='× Nombre o correo inválido.';state.className='aggy-note blocked';return}if(!contacts.some(contact=>contact.email===email))contacts.push({name,email});renderMemoryList($('#aggyContactList'),contacts,contact=>`${contact.name} · ${contact.email}`);renderCommunicationData();state.textContent='✓ Contacto creado en memoria. La habilitación de chat exige validación del backend.';state.className='aggy-note ready'});
  $('#aggyCreateGroup')?.addEventListener('click',()=>{const name=$('#aggyGroupName').value.trim(),members=$('#aggyGroupMembers').value.split(/[;,\n]+/).map(value=>value.trim().toLowerCase()).filter(Boolean),state=$('#aggyGroupState'),unique=[...new Set(members)];if(!identityVerified()){state.textContent='× QuIdentify/Okta debe estar verificado.';state.className='aggy-note blocked';return}if(!name||unique.length<2||unique.some(email=>!emailPattern.test(email))){state.textContent='× Indica un nombre y al menos dos correos válidos.';state.className='aggy-note blocked';return}groups.push({name,members:unique});renderMemoryList($('#aggyGroupList'),groups,group=>`${group.name} · ${group.members.length} miembros`);renderCommunicationData();state.textContent='✓ Grupo creado en memoria. Cada miembro será validado por el backend antes de una conversación real.';state.className='aggy-note ready'});

  const callHistory=[];
  const callEndpoint='https://aggy.secquoia.group/api/aggy/calls/preflight';
  const setCallGate=(name,ready)=>{const gate=$(`[data-call-gate="${name}"]`);if(gate)gate.className=ready?'ready':'blocked'};
  const callTarget=()=>callKind==='group'?$('#aggyCallGroup')?.value:$('#aggyCallPeer')?.value;
  const resetCallReadiness=message=>{
    callReceipt=null;$('#aggyCallStart').disabled=true;const badge=$('#aggyCallBadge');badge.className='aggy-state blocked';badge.textContent='E2EE/PQC NO VERIFICADO';
    ['identity','webrtc','media','signaling','keys'].forEach(name=>setCallGate(name,false));
    if(message)$('#aggyCallState').textContent=message;
  };
  const syncCallControls=()=>{
    $$('[data-call-kind]').forEach(button=>button.classList.toggle('active',button.dataset.callKind===callKind));
    $('#aggyCallPeerLabel').classList.toggle('hidden',callKind!=='individual');$('#aggyCallGroupLabel').classList.toggle('hidden',callKind!=='group');
    resetCallReadiness();
  };
  const renderCallHistory=()=>{
    const root=$('#aggyCallHistory');root.replaceChildren();
    if(!callHistory.length){const empty=document.createElement('p');empty.className='aggy-empty';empty.textContent='No hay intentos de llamada en esta sesión.';root.append(empty);return}
    for(const entry of callHistory){
      const row=document.createElement('article'),icon=document.createElement('span'),copy=document.createElement('p'),strong=document.createElement('strong'),small=document.createElement('small'),time=document.createElement('time');
      row.className=`aggy-call-entry ${entry.ready?'ready':'blocked'}`;icon.textContent=entry.ready?'☎':'↗';strong.textContent=entry.target;small.textContent=`${entry.kind==='group'?'Grupal':'Individual'} · ${entry.media==='video'?'video':'audio'} · ${entry.ready?'E2EE/PQC verificado':'bloqueada'}`;time.textContent=entry.time;copy.append(strong,small);row.append(icon,copy,time);root.append(row);
    }
  };
  const recordCall=(ready,target)=>{callHistory.unshift({ready,target,kind:callKind,media:callMedia,time:new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date())});renderCallHistory()};
  const supportsEncodedMedia=()=>Boolean(window.RTCRtpScriptTransform||window.RTCRtpSender?.prototype?.createEncodedStreams);
  const preflightCall=async()=>{
    const state=$('#aggyCallState'),badge=$('#aggyCallBadge'),target=callTarget(),webRtc=typeof RTCPeerConnection==='function',encoded=supportsEncodedMedia(),identity=identityVerified();
    resetCallReadiness();setCallGate('identity',identity);setCallGate('webrtc',webRtc);setCallGate('media',encoded);
    if(!target){state.textContent=`Selecciona ${callKind==='group'?'un grupo':'un contacto'} antes de verificar.`;recordCall(false,'Destino no seleccionado');return}
    if(!identity){state.textContent='BLOQUEADO · QuIdentify/Okta no está verificado. No se abrió el micrófono ni la cámara.';recordCall(false,target);return}
    if(!webRtc||!encoded){state.textContent='BLOQUEADO · este navegador no demuestra soporte para medios WebRTC bajo el perfil E2EE/PQC.';recordCall(false,target);return}
    badge.className='aggy-state checking';badge.textContent='VERIFICANDO';state.textContent='Consultando señalización, llaves efímeras y recibos de cifrado…';
    try{
      const response=await fetch(callEndpoint,{method:'GET',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)}),body=await response.json();
      const gates=body.gates||{};setCallGate('signaling',response.ok&&gates.signaling===true);setCallGate('keys',response.ok&&gates.keyExchange===true&&gates.qufense===true&&gates.quvault===true);setCallGate('media',encoded&&response.ok&&gates.mediaE2EE===true);
      const ready=response.ok&&body.status==='ready'&&body.e2eeVerified===true&&gates.identityBinding===true&&gates.signaling===true&&gates.keyExchange===true&&gates.mediaE2EE===true&&gates.qufense===true&&gates.quvault===true&&typeof body.joinUrl==='string';
      if(!ready)throw new Error(body.error||body.status||'e2ee_not_verified');
      const join=new URL(body.joinUrl);
      if(join.protocol!=='https:'||!/(^|\.)secquoia\.(net|group)$/.test(join.hostname))throw new Error('untrusted_join_url');
      callReceipt={joinUrl:join.href,receiptId:String(body.receiptId||'')};$('#aggyCallStart').disabled=false;badge.className='aggy-state ready';badge.textContent='E2EE/PQC VERIFICADO';state.textContent=`Ruta lista · recibo ${callReceipt.receiptId||'verificado'}. El permiso de ${callMedia==='video'?'cámara y micrófono':'micrófono'} se solicitará al iniciar.`;recordCall(true,target);
    }catch{
      badge.className='aggy-state blocked';badge.textContent='E2EE/PQC NO DISPONIBLE';state.textContent='BLOQUEADO · la infraestructura no entregó evidencia completa de identidad, señalización, llaves y cifrado de medios. No se abrió el micrófono ni la cámara.';recordCall(false,target);
    }
  };
  $$('[data-chat-call]').forEach(button=>button.addEventListener('click',()=>{
    callMedia=button.dataset.chatCall==='video'?'video':'audio';
    callKind='individual';
    syncCallControls();
    $$('[data-call-media]').forEach(item=>item.classList.toggle('active',item.dataset.callMedia===callMedia));
    setPanel('calls');
    $('#aggyCallState').textContent=`Llamada ${callMedia==='video'?'de video':'de audio'} iniciada desde el chat. Selecciona una persona o cambia a grupal; Aggy verificará E2EE/PQC antes de solicitar permisos.`;
  }));
  $$('[data-call-kind]').forEach(button=>button.addEventListener('click',()=>{callKind=button.dataset.callKind;syncCallControls()}));
  $$('[data-call-media]').forEach(button=>button.addEventListener('click',()=>{callMedia=button.dataset.callMedia;$$('[data-call-media]').forEach(item=>item.classList.toggle('active',item===button));resetCallReadiness('Medio actualizado. Verifica nuevamente la ruta E2EE/PQC.')}));
  $('#aggyCallPeer')?.addEventListener('change',()=>resetCallReadiness('Destino actualizado. Verifica nuevamente la ruta E2EE/PQC.'));
  $('#aggyCallGroup')?.addEventListener('change',()=>resetCallReadiness('Grupo actualizado. Verifica nuevamente la ruta E2EE/PQC.'));
  $('#aggyCallPreflight')?.addEventListener('click',()=>preflightCall());
  $('#aggyCallStart')?.addEventListener('click',()=>{if(!callReceipt)return resetCallReadiness('La evidencia E2EE/PQC expiró o no existe. Verifica nuevamente.');location.assign(callReceipt.joinUrl)});
  $('#aggyClearCallHistory')?.addEventListener('click',()=>{callHistory.length=0;renderCallHistory()});
  $('#aggyContactSearch')?.addEventListener('input',renderCommunicationData);$('#aggyGroupSearch')?.addEventListener('input',renderCommunicationData);
  $$('[data-contact-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.contactFilter;$$('[data-contact-filter]').forEach(item=>item.classList.toggle('active',item===button));if(filter==='groups')setPanel('groups');else renderCommunicationData()}));

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
  const nameMirror=$('[data-aggy-name-mirror]'),visitorName=$('#visitorName');
  if(nameMirror&&visitorName){nameMirror.value=visitorName.value;nameMirror.addEventListener('input',()=>{visitorName.value=nameMirror.value;visitorName.dispatchEvent(new Event('input',{bubbles:true}))});visitorName.addEventListener('input',()=>{nameMirror.value=visitorName.value})}
  renderCommunicationData();syncCallControls();renderCallHistory();contextualUpdate();refreshModelCatalog();
})();
