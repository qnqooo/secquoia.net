(()=>{
  'use strict';
  const cryptoApi=window.AggySecureChatCrypto;
  if(!cryptoApi)return;
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const apiOrigin='https://aggy.secquoia.group';
  const state={device:null,room:null,bundles:[],after:0,poll:null,seen:new Set()};

  const openDb=()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('secquoia-aggy-quvault',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('device');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  const dbGet=async key=>{
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('device','readonly'),request=tx.objectStore('device').get(key);
      request.onsuccess=()=>resolve(request.result||null);
      request.onerror=()=>reject(request.error);
    });
  };
  const dbPut=async(key,value)=>{
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('device','readwrite');
      tx.objectStore('device').put(value,key);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
  };
  const shortFingerprint=value=>String(value||'').match(/.{1,8}/g)?.slice(0,6).join(' ')||'—';
  const setStatus=(text,kind='')=>{
    const el=$('#aggySecureStatus');
    if(el)el.textContent=text;
    const badge=$('#aggySecureBadge');
    if(badge)badge.className=kind;
  };
  const message=(text,who='system',meta='')=>{
    const root=$('#aggySecureConversation');
    root.querySelector('.aggy-empty')?.remove();
    const item=document.createElement('article');
    item.className=`aggy-secure-message ${who}`;
    const body=document.createElement('p');
    body.textContent=text;
    const small=document.createElement('small');
    small.textContent=meta;
    item.append(body,small);
    root.append(item);
    root.scrollTop=root.scrollHeight;
  };
  const request=async(path,init={})=>{
    const headers=new Headers(init.headers||{});
    if(state.room)headers.set('Authorization',`Bearer ${state.room.capability}`);
    if(init.body)headers.set('Content-Type','application/json');
    const response=await fetch(`${apiOrigin}${path}`,{...init,headers,cache:'no-store'});
    let body={};
    try{body=await response.json()}catch{}
    if(!response.ok)throw new Error(body.error||`http_${response.status}`);
    return body;
  };
  const loadDevice=async()=>{
    state.device=await dbGet('device-keys');
    if(!state.device){
      state.device=cryptoApi.createDeviceKeys();
      await dbPut('device-keys',state.device);
    }
    $('#aggyMyFingerprint').textContent=shortFingerprint(state.device.publicBundle.fingerprint);
  };
  const inviteFor=room=>`${location.origin}${location.pathname}${location.search}#aggy-room=${room.secret}`;
  const enterRoom=async room=>{
    state.room=room;
    state.after=0;
    state.seen.clear();
    $('#aggyInviteBox').classList.remove('hidden');
    $('#aggyInviteLink').textContent=inviteFor(room);
    $('#aggySecureThreadState').textContent=`Sala ${room.roomId.slice(0,8)} · cifrada`;
    setStatus('Conectando sala cifrada…','checking');
    await request(`/api/aggy/messages/rooms/${room.roomId}/bundles`,{
      method:'PUT',
      body:JSON.stringify({bundle:state.device.publicBundle})
    });
    await refreshBundles();
    clearInterval(state.poll);
    state.poll=setInterval(pollMessages,1800);
    await pollMessages();
  };
  const refreshBundles=async()=>{
    const result=await request(`/api/aggy/messages/rooms/${state.room.roomId}/bundles`);
    state.bundles=result.bundles||[];
    const peers=state.bundles.filter(bundle=>bundle.deviceId!==state.device.publicBundle.deviceId);
    if(peers.length){
      $('#aggyPeerFingerprint').textContent=shortFingerprint(peers[0].fingerprint)+(peers.length>1?` · +${peers.length-1}`:'');
      $('#aggySecureSend').disabled=false;
      setStatus(`${peers.length} participante${peers.length===1?'':'s'} · compara la huella`,'ready');
    }else{
      $('#aggyPeerFingerprint').textContent='Esperando participante';
      $('#aggySecureSend').disabled=true;
      setStatus('Sala lista · esperando otra huella','checking');
    }
    return peers;
  };
  const pollMessages=async()=>{
    if(!state.room)return;
    try{
      const result=await request(`/api/aggy/messages/rooms/${state.room.roomId}/messages?deviceId=${encodeURIComponent(state.device.publicBundle.deviceId)}&after=${state.after}`);
      for(const row of result.messages||[]){
        state.after=Math.max(state.after,row.sequence);
        if(state.seen.has(row.envelope.header.recordId))continue;
        state.seen.add(row.envelope.header.recordId);
        try{
          const clear=cryptoApi.decryptMessage({roomId:state.room.roomId,envelope:row.envelope,recipient:state.device});
          message(clear.text,'peer',`${new Date(clear.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · firma y admisión verificadas`);
        }catch{
          message('Mensaje bloqueado: la firma, la admisión o el destinatario no pudo verificarse.','blocked','QuFense · fail closed');
        }
      }
      if((result.messages||[]).length===0)await refreshBundles();
    }catch(error){
      setStatus(`Sin conexión · ${error.message}`,'blocked');
    }
  };
  const sendSecure=async text=>{
    const sanitized=await request('/api/aggy/messages/sanitize',{
      method:'POST',
      body:JSON.stringify({text})
    });
    const peers=await refreshBundles();
    if(!peers.length)throw new Error('waiting_for_recipient');
    for(const recipient of peers){
      const envelope=cryptoApi.encryptMessage({
        roomId:state.room.roomId,
        text:sanitized.sanitizedText,
        admissionReceipt:sanitized.receipt,
        sender:state.device,
        recipient
      });
      await request(`/api/aggy/messages/rooms/${state.room.roomId}/messages`,{
        method:'POST',
        body:JSON.stringify({envelope})
      });
    }
    message(sanitized.sanitizedText,'self',`${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · QuSOC → E2EE/PQC`);
  };
  const selectThread=name=>{
    $$('[data-aggy-thread]').forEach(button=>button.classList.toggle('active',button.dataset.aggyThread===name));
    $$('[data-aggy-thread-view]').forEach(view=>view.classList.toggle('active',view.dataset.aggyThreadView===name));
  };

  document.addEventListener('DOMContentLoaded',async()=>{
    try{await loadDevice()}catch{setStatus('No fue posible crear la bóveda local','blocked');return}
    $$('[data-aggy-thread]').forEach(button=>button.addEventListener('click',()=>selectThread(button.dataset.aggyThread)));
    $('#aggyNewSecureRoom')?.addEventListener('click',()=>{selectThread('secure');$('#aggyCreateRoom').focus()});
    $('#aggyCreateRoom')?.addEventListener('click',async()=>{
      try{
        const room=cryptoApi.createRoomSecret();
        history.replaceState(null,'',`${location.pathname}${location.search}#aggy-room=${room.secret}`);
        await enterRoom(room);
      }catch(error){setStatus(`No se pudo crear · ${error.message}`,'blocked')}
    });
    $('#aggyJoinRoom')?.addEventListener('click',async()=>{
      try{
        const value=$('#aggyJoinRoomInput').value.trim();
        const secret=(value.match(/[#&]aggy-room=([^&]+)/)||[])[1]||value;
        const room=cryptoApi.deriveRoomSecret(decodeURIComponent(secret));
        history.replaceState(null,'',`${location.pathname}${location.search}#aggy-room=${room.secret}`);
        await enterRoom(room);
      }catch{setStatus('Invitación inválida','blocked')}
    });
    $('#aggyCopyInvite')?.addEventListener('click',async()=>{
      await navigator.clipboard.writeText($('#aggyInviteLink').textContent);
      $('#aggyCopyInvite').textContent='Copiada';
      setTimeout(()=>$('#aggyCopyInvite').textContent='Copiar invitación',1400);
    });
    $('#aggySecureComposer')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const input=$('#aggySecureInput'),text=input.value.trim();
      if(!text||!state.room)return;
      input.disabled=true;
      try{await sendSecure(text);input.value=''}catch(error){message(`No enviado: ${error.message}`,'blocked','QuFense · fail closed')}
      finally{input.disabled=false;input.focus()}
    });
    const hashSecret=(location.hash.match(/(?:^#|&)aggy-room=([^&]+)/)||[])[1];
    if(hashSecret){
      selectThread('secure');
      try{await enterRoom(cryptoApi.deriveRoomSecret(decodeURIComponent(hashSecret)))}catch{setStatus('La invitación no pudo abrirse','blocked')}
    }
  });
})();
