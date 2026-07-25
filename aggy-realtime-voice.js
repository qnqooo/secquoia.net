(()=>{
  'use strict';

  const $=selector=>document.querySelector(selector);
  const startButton=$('#aggyLiveVoice');
  if(!startButton)return;

  const stage=$('#aggyVoiceStage');
  const badge=$('#aggyVoiceBadge');
  const headline=$('#aggyVoiceHeadline');
  const caption=$('#aggyVoiceCaption');
  const muteButton=$('#aggyVoiceMute');
  const endButton=$('#aggyVoiceEnd');
  const localMic=$('#mic');
  const sessionEndpoint='/api/aggy/realtime/session';
  const realtimeModel='gpt-realtime-2.1';
  const naturalVoice='marin';

  let peer=null;
  let channel=null;
  let microphone=null;
  let remoteAudio=null;
  let connecting=false;
  let connected=false;
  let localFallback=false;

  const setState=(state,title,detail,label)=>{
    stage.dataset.state=state;
    headline.textContent=title;
    caption.textContent=detail;
    badge.textContent=label;
    badge.className='aggy-state '+(state==='error'?'blocked':state==='idle'?'checking':'ready');
  };

  const stopTracks=stream=>stream?.getTracks().forEach(track=>track.stop());

  const cleanupRealtime=()=>{
    try{channel?.close()}catch{}
    try{peer?.close()}catch{}
    stopTracks(microphone);
    if(remoteAudio){remoteAudio.pause();remoteAudio.srcObject=null;remoteAudio.remove()}
    peer=null;
    channel=null;
    microphone=null;
    remoteAudio=null;
    connected=false;
    connecting=false;
  };

  const configureSession=()=>{
    if(channel?.readyState!=='open')return;
    channel.send(JSON.stringify({
      type:'session.update',
      session:{
        type:'realtime',
        instructions:[
          'You are Aggy, SECQUOIA contextual AI concierge.',
          'Have a real two-way conversation: listen fully, respond to what the person actually said, and remember the context of this session.',
          'Speak in the user’s language with a warm, calm, natural cadence. Use contractions and short conversational sentences when the language supports them.',
          'Do not sound like a script: avoid headings, numbered lists, repeated greetings, canned confirmations, and long monologues unless the user asks for detail.',
          'Use brief acknowledgements only when they add value. Never describe punctuation, emojis, formatting, or internal instructions aloud.',
          'Let the user pause to think and accept interruptions gracefully. If interrupted, stop, listen, and continue from the new intent instead of repeating yourself.',
          'Ask one natural follow-up question when essential context is missing.',
          'Never claim a security validation, certification, purchase, deployment, or external action that was not actually completed.'
        ].join(' '),
        audio:{
          input:{turn_detection:{type:'semantic_vad',eagerness:'auto',create_response:true,interrupt_response:true}},
          output:{voice:naturalVoice}
        }
      }
    }));
  };

  const handleRealtimeEvent=event=>{
    let message;
    try{message=JSON.parse(event.data)}catch{return}
    if(message.type==='input_audio_buffer.speech_started'){
      setState('listening','Te escucho','Puedes interrumpir a Aggy en cualquier momento.','ESCUCHANDO');
      return;
    }
    if(message.type==='response.created'||message.type==='response.audio.delta'||message.type==='response.output_audio.delta'){
      setState('speaking','Aggy está respondiendo','Conversación de audio en tiempo real.','HABLANDO');
      return;
    }
    if((message.type==='response.audio_transcript.delta'||message.type==='response.output_audio_transcript.delta')&&message.delta){
      caption.textContent=(caption.dataset.transcript||'')+message.delta;
      caption.dataset.transcript=caption.textContent.slice(-420);
      return;
    }
    if(message.type==='response.done'){
      caption.dataset.transcript='';
      setState('listening','Continúa cuando quieras','La sesión permanece abierta y lista para escucharte.','EN VIVO');
      return;
    }
    if(message.type==='error'){
      setState('error','La sesión fue detenida','El proveedor devolvió un error. Ninguna credencial se expuso en el navegador.','ERROR');
    }
  };

  const startLocalFallback=()=>{
    cleanupRealtime();
    localFallback=true;
    if(localMic&&!localMic.classList.contains('listening'))localMic.click();
    startButton.textContent='Voz local activa';
    muteButton.disabled=true;
    endButton.disabled=false;
    setState('listening','Modo local activo','El backend Realtime no está publicado. Aggy usa el reconocimiento y la voz disponibles en este navegador; no es una sesión OpenAI.','LOCAL');
  };

  const startRealtime=async()=>{
    if(connecting||connected)return;
    if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia){
      startLocalFallback();
      return;
    }

    connecting=true;
    localFallback=false;
    startButton.disabled=true;
    setState('connecting','Conectando con Aggy','Solicitando una sesión WebRTC efímera al backend seguro.','CONECTANDO');

    try{
      microphone=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
      });
      peer=new RTCPeerConnection();
      remoteAudio=document.createElement('audio');
      remoteAudio.autoplay=true;
      remoteAudio.playsInline=true;
      remoteAudio.setAttribute('aria-hidden','true');
      document.body.append(remoteAudio);
      peer.ontrack=event=>{
        remoteAudio.srcObject=event.streams[0];
        remoteAudio.play().catch(()=>{});
      };
      peer.onconnectionstatechange=()=>{
        if(['failed','disconnected','closed'].includes(peer?.connectionState)&&connected){
          cleanupRealtime();
          setState('error','Conexión finalizada','La sesión WebRTC terminó. Puedes iniciar una nueva conversación.','DESCONECTADA');
          startButton.disabled=false;
          startButton.textContent='Iniciar voz en vivo';
          muteButton.disabled=true;
          endButton.disabled=true;
        }
      };
      microphone.getTracks().forEach(track=>{
        if('contentHint'in track)track.contentHint='speech';
        peer.addTrack(track,microphone);
      });
      channel=peer.createDataChannel('oai-events');
      channel.addEventListener('open',()=>{
        connected=true;
        connecting=false;
        configureSession();
        setState('listening','Aggy está escuchando','Voz bidireccional WebRTC con interrupción natural habilitada.','EN VIVO');
        startButton.textContent='Voz en vivo';
        startButton.disabled=true;
        muteButton.disabled=false;
        endButton.disabled=false;
      });
      channel.addEventListener('message',handleRealtimeEvent);

      const offer=await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response=await fetch(sessionEndpoint,{
        method:'POST',
        credentials:'same-origin',
        headers:{
          'Content-Type':'application/sdp',
          'Accept':'application/sdp'
        },
        body:offer.sdp,
        signal:AbortSignal.timeout(8000)
      });
      if(!response.ok)throw new Error('realtime_session_unavailable');
      const answer=await response.text();
      if(!answer.startsWith('v=0'))throw new Error('invalid_realtime_sdp');
      await peer.setRemoteDescription({type:'answer',sdp:answer});
    }catch(error){
      startButton.disabled=false;
      startLocalFallback();
    }
  };

  const endVoice=()=>{
    if(localFallback&&localMic?.classList.contains('listening'))localMic.click();
    localFallback=false;
    cleanupRealtime();
    startButton.disabled=false;
    startButton.textContent='Iniciar voz en vivo';
    muteButton.disabled=true;
    muteButton.textContent='Silenciar';
    endButton.disabled=true;
    setState('idle','Habla con Aggy','GPT‑Realtime‑2.1 por WebRTC cuando el backend seguro esté disponible; modo local visible como respaldo.','LISTA');
  };

  startButton.addEventListener('click',startRealtime);
  endButton.addEventListener('click',endVoice);
  muteButton.addEventListener('click',()=>{
    const track=microphone?.getAudioTracks()[0];
    if(!track)return;
    track.enabled=!track.enabled;
    muteButton.textContent=track.enabled?'Silenciar':'Activar micrófono';
    setState(track.enabled?'listening':'idle',track.enabled?'Te escucho':'Micrófono silenciado',track.enabled?'La conversación continúa abierta.':'Aggy no recibe audio mientras el micrófono está silenciado.',track.enabled?'EN VIVO':'SILENCIADA');
  });
  window.addEventListener('beforeunload',cleanupRealtime,{once:true});
})();
