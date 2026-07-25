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
  const sessionEndpoint='https://aggy.secquoia.group/api/aggy/realtime/session';
  const healthEndpoint='https://aggy.secquoia.group/api/aggy/realtime/health';
  const qugeoEndpoint='https://qugeo.secquoia.group/v1/context';
  const realtimeModel='gpt-realtime-2.1';
  const naturalVoice='marin';

  let peer=null;
  let channel=null;
  let microphone=null;
  let remoteAudio=null;
  let connecting=false;
  let connected=false;
  let localFallback=false;
  let qugeoLanguage='en';
  let qugeoLocale='en-US';
  let qugeoContext=null;
  let greetingSent=false;

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

  const selectedLanguage=()=>{
    const preference=$('#aggyLanguage')?.value||'AUTO';
    return preference==='AUTO'?qugeoLanguage:preference.toLowerCase();
  };

  const usableQugeoContext=value=>{
    if(!value||value.schema!=='secquoia.qugeo.context.v1')return null;
    return {
      schema:value.schema,
      location:{
        countryCode:value.location?.countryCode||null,
        countryName:value.location?.countryName||null,
        city:value.location?.city||null,
        region:value.location?.region||null,
        coordinates:value.location?.coordinates||null,
        approximate:true
      },
      time:{
        timezone:value.time?.timezone||'UTC',
        localDate:value.time?.localDate||null,
        localTime:value.time?.localTime||null,
        greetingPeriod:value.time?.greetingPeriod||null
      },
      language:{
        code:value.language?.code||'en',
        locale:value.language?.locale||'en-US'
      },
      country:{
        capital:value.country?.capital||null,
        region:value.country?.region||null,
        population:value.country?.population||null,
        populationYear:value.country?.populationYear||null
      },
      culturalPolicy:value.conversation?.culturalContext||null,
      privacy:value.privacy||null
    };
  };

  const sendInitialGreeting=()=>{
    if(greetingSent||channel?.readyState!=='open')return;
    greetingSent=true;
    const language=selectedLanguage();
    channel.send(JSON.stringify({
      type:'response.create',
      response:{
        instructions:`Start the live voice conversation in ${language}. First say one short, warm greeting and mention that you are Aggy. After the greeting, in a separate sentence, ask one brief natural question equivalent to "How can I help you today?". Speak both sentences aloud through Realtime audio. Do not use headings, lists, text-only output, or repeat this opening later.`
      }
    }));
  };

  const configureSession=()=>{
    if(channel?.readyState!=='open')return;
    const language=selectedLanguage();
    const contextualInstruction=qugeoContext
      ? `QuGEO supplied this approximate network context: ${JSON.stringify(qugeoContext)}. Use it only when relevant. Never treat it as proof of identity, exact physical location, personal customs, religion, ethnicity, or politics. Ask the user before applying culturally specific assumptions.`
      : 'QuGEO context is unavailable. Do not guess the user location or culture.';
    channel.send(JSON.stringify({
      type:'session.update',
      session:{
        type:'realtime',
        instructions:[
          'You are Aggy, SECQUOIA contextual AI concierge.',
          'Have a real two-way conversation: listen fully, respond to what the person actually said, and remember the context of this session.',
          `QuGEO selected ${language} as the initial conversation language. Speak in that language unless the user changes language.`,
          contextualInstruction,
          'Use a warm, calm, natural cadence. Use contractions and short conversational sentences when the language supports them.',
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
      const completedTranscript=(caption.dataset.transcript||'').trim();
      caption.dataset.transcript='';
      setState('listening','Continúa cuando quieras',completedTranscript||'La sesión permanece abierta y lista para escucharte.','EN VIVO');
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
    greetingSent=false;
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
        remoteAudio.play().catch(()=>{
          document.addEventListener('pointerdown',()=>remoteAudio?.play().catch(()=>{}),{once:true});
        });
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
        sendInitialGreeting();
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
        credentials:'omit',
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

  const prewarmVoice=async()=>{
    setState('connecting','Aggy Voice se está preparando','Verificando el servicio seguro sin abrir el micrófono ni consumir una sesión del proveedor.','ACTIVANDO');
    try{
      const [voiceResult,qugeoResult]=await Promise.allSettled([
        fetch(healthEndpoint,{method:'GET',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(4000)}),
        fetch(qugeoEndpoint,{method:'GET',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(4500)})
      ]);
      if(voiceResult.status!=='fulfilled')throw new Error('voice_service_unavailable');
      const response=voiceResult.value;
      const status=await response.json();
      if(!response.ok||status.status!=='ready')throw new Error('voice_service_unavailable');
      if(qugeoResult.status==='fulfilled'&&qugeoResult.value.ok){
        qugeoContext=usableQugeoContext(await qugeoResult.value.json());
      }
      qugeoLanguage=qugeoContext?.language?.code||status.qugeo?.language||qugeoLanguage;
      qugeoLocale=qugeoContext?.language?.locale||status.qugeo?.locale||qugeoLocale;
      sessionStorage.setItem('secquoia.qugeo.language',qugeoLanguage);
      sessionStorage.setItem('secquoia.qugeo.locale',qugeoLocale);
      if(qugeoContext)sessionStorage.setItem('secquoia.qugeo.context',JSON.stringify(qugeoContext));
      startButton.textContent='Activar micrófono';
      const place=qugeoContext?.location?.countryName||qugeoLocale;
      setState('idle','Aggy Voice está activo',`QuGEO detectó ${place} · ${qugeoLocale}. Autoriza el micrófono y Aggy iniciará con un saludo natural.`,'ACTIVO');
      if(navigator.permissions?.query){
        try{
          const permission=await navigator.permissions.query({name:'microphone'});
          if(permission.state==='granted')await startRealtime();
          else permission.addEventListener?.('change',()=>{if(permission.state==='granted')startRealtime()},{once:true});
        }catch{}
      }
    }catch{
      setState('error','Aggy Voice no está disponible','No se pudo verificar el backend seguro. El modo local permanece disponible.','SIN CONEXIÓN');
    }
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
  prewarmVoice();
})();
