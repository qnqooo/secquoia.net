(()=>{
  'use strict';

  if(window.__SECQUOIA_AGGY_EMBED__)return;
  window.__SECQUOIA_AGGY_EMBED__=true;

  const script=document.currentScript;
  const site=script?.dataset.aggySite||location.hostname||'unknown';
  const version='1.0.0-rc.35';
  const frameUrl=`https://secquoia.net/qu-market.html?embed=1&aggy=1&site=${encodeURIComponent(site)}&v=${encodeURIComponent(version)}`;
  const host=document.createElement('div');
  host.id='secquoia-aggy-embed';
  const root=host.attachShadow({mode:'open'});

  root.innerHTML=`
    <style>
      :host{all:initial}
      *{box-sizing:border-box}
      .launcher{position:fixed;right:18px;bottom:18px;z-index:2147483646;display:flex;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:linear-gradient(135deg,#35ff8c,#00c76a);color:#031008;padding:9px 15px 9px 12px;font:900 14px/1 Inter,Segoe UI,Arial,sans-serif;box-shadow:0 14px 46px rgba(0,0,0,.38);cursor:pointer}
      .launcher:focus-visible,.close:focus-visible{outline:3px solid #fff;outline-offset:3px}
      .dot{position:relative;width:9px;height:9px;border-radius:50%;background:#031008;box-shadow:0 0 0 4px rgba(3,16,8,.14)}
      .dot::after{content:"";position:absolute;inset:-7px;border:2px solid rgba(3,16,8,.38);border-radius:50%;opacity:0;transform:scale(.65)}
      .launcher[data-voice="connecting"] .dot::after,.launcher[data-voice="live"] .dot::after{animation:aggy-live-halo 1.35s ease-out infinite}
      .launcher[data-voice="live"]{box-shadow:0 0 0 5px rgba(53,255,140,.18),0 14px 46px rgba(0,0,0,.38)}
      .launcher[data-voice="blocked"]{background:linear-gradient(135deg,#ffe39a,#ffb84f)}
      .launcher-copy{display:grid;gap:2px;text-align:left}
      .launcher-copy small{font:750 9px/1.1 Inter,Segoe UI,Arial,sans-serif;opacity:.72}
      .launcher-nudge{position:absolute;right:4px;bottom:calc(100% + 10px);width:max-content;max-width:min(250px,calc(100vw - 24px));border:1px solid rgba(255,255,255,.72);border-radius:12px;background:linear-gradient(135deg,#1677ff,#52b6ff);color:#fff;padding:8px 11px;font:800 10px/1.3 Inter,Segoe UI,Arial,sans-serif;box-shadow:0 12px 34px rgba(0,74,180,.32);animation:aggy-guide-pulse 1.7s ease-in-out infinite}
      .launcher-nudge::after{content:"";position:absolute;right:24px;top:100%;border:7px solid transparent;border-top-color:#52b6ff}
      .launcher[data-guide-dismissed="true"] .launcher-nudge{display:none}
      .minute-chain{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;width:118px;margin-top:3px}
      .minute-link{height:4px;border-radius:999px;background:rgba(3,16,8,.15);box-shadow:inset 0 0 0 1px rgba(3,16,8,.12);transition:background .22s ease,box-shadow .22s ease,transform .22s ease}
      .minute-link:nth-child(1){--link-color:#12c96b}.minute-link:nth-child(2){--link-color:#55d85a}.minute-link:nth-child(3){--link-color:#8ddd48}.minute-link:nth-child(4){--link-color:#bfdb3b}.minute-link:nth-child(5){--link-color:#e4cd32}.minute-link:nth-child(6){--link-color:#f5aa2d}.minute-link:nth-child(7){--link-color:#f5842e}.minute-link:nth-child(8){--link-color:#ef5e39}.minute-link:nth-child(9){--link-color:#e63f42}.minute-link:nth-child(10){--link-color:#d91e32}
      .minute-link.lit{background:var(--link-color);box-shadow:0 0 7px color-mix(in srgb,var(--link-color) 72%,transparent);transform:scaleY(1.35)}
      .minute-chain.exhausted .minute-link{background:#d91e32;box-shadow:0 0 7px rgba(217,30,50,.66)}
      .minute-chain.exhausted .minute-link:last-child{animation:aggy-final-minute .8s ease-in-out infinite alternate}
      .minute-chain.contract{display:none}
      .panel{position:fixed;right:18px;bottom:76px;z-index:2147483647;width:min(460px,calc(100vw - 28px));height:min(700px,calc(100vh - 100px));border:1px solid rgba(255,255,255,.24);border-radius:24px;background:#06110b;box-shadow:0 24px 80px rgba(0,0,0,.58);overflow:hidden;opacity:0;transform:translateY(18px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease}
      .panel.open{opacity:1;transform:none;pointer-events:auto}
      .bar{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 15px;border-bottom:1px solid rgba(255,255,255,.12);background:#07180f;color:#effff5;font:850 12px/1 Inter,Segoe UI,Arial,sans-serif}
      .bar small{color:#9fb3a6;font-weight:700}
      .close{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font:900 18px/1 Arial;cursor:pointer}
      iframe{display:block;width:100%;height:calc(100% - 46px);border:0;background:#f4f7f6}
      .frame-state{position:absolute;inset:46px 0 0;z-index:2;display:grid;place-items:center;background:linear-gradient(180deg,#f7faf9,#eaf1ee);color:#17352a;text-align:center;padding:24px;font:750 12px/1.5 Inter,Segoe UI,Arial,sans-serif}
      .frame-state[hidden]{display:none}
      .frame-state div{display:grid;justify-items:center;gap:10px}
      .frame-state i{width:34px;height:34px;border:3px solid #b7d6c9;border-top-color:#0e9b67;border-radius:50%;animation:aggy-frame-spin .85s linear infinite}
      .frame-state button{border:1px solid #1ca975;border-radius:999px;background:#e8faf2;color:#07583c;padding:8px 12px;font:850 11px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
      @media(max-width:560px){.launcher{right:12px;bottom:12px}.panel{inset:8px;width:auto;height:auto;border-radius:20px}}
      @keyframes aggy-live-halo{0%{opacity:.72;transform:scale(.65)}75%,100%{opacity:0;transform:scale(1.75)}}
      @keyframes aggy-guide-pulse{50%{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,74,180,.46)}}
      @keyframes aggy-final-minute{to{transform:scaleY(1.8);filter:brightness(1.28)}}
      @keyframes aggy-frame-spin{to{transform:rotate(360deg)}}
      @media(prefers-reduced-motion:reduce){.panel{transition:none}.dot::after,.minute-link,.launcher-nudge{animation:none!important}}
    </style>
    <button class="launcher" type="button" data-voice="connecting" aria-expanded="false" aria-controls="aggy-panel" title="Aggy ${version}">
      <span class="launcher-nudge" role="note">Toca aquí: chat, archivos y llamadas seguras</span>
      <span class="dot" aria-hidden="true"></span><span class="launcher-copy"><strong>Aggy</strong><small>Conectando Voice LIVE…</small><span class="minute-chain" role="meter" aria-label="10 minutos de Voz LIVE disponibles" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0">${'<i class="minute-link"></i>'.repeat(10)}</span></span>
    </button>
    <section class="panel" id="aggy-panel" role="dialog" aria-label="Aggy, asistente de SECQUOIA">
      <div class="bar"><span>Aggy <small>${version}</small></span><button class="close" type="button" aria-label="Cerrar Aggy">×</button></div>
      <div class="frame-state" role="status"><div><i aria-hidden="true"></i><span>Conectando la experiencia segura de Aggy…</span><button type="button" hidden>Reintentar</button></div></div>
      <iframe title="Aggy Communications" src="${frameUrl}" allow="microphone; autoplay" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation-by-user-activation"></iframe>
    </section>
  `;

  const launcher=root.querySelector('.launcher');
  const panel=root.querySelector('.panel');
  const close=root.querySelector('.close');
  const frame=root.querySelector('iframe');
  const frameState=root.querySelector('.frame-state');
  const frameStateCopy=frameState.querySelector('span');
  const frameRetry=frameState.querySelector('button');
  const launcherStatus=launcher.querySelector('small');
  const minuteChain=launcher.querySelector('.minute-chain');
  const minuteLinks=[...launcher.querySelectorAll('.minute-link')];
  const updateMinuteChain=detail=>{
    const contractIncluded=['CONTRACT_INCLUDED','ECOSYSTEM_PREVIEW'].includes(detail.accessMode);
    launcher.dataset.accessMode=String(detail.accessMode||'VISITOR_TRIAL');
    minuteChain.classList.toggle('contract',contractIncluded);
    if(contractIncluded){
      const preview=detail.accessMode==='ECOSYSTEM_PREVIEW';
      minuteChain.setAttribute('aria-label',preview?'Acceso Ecosystem Preview sin consumo':'Voz LIVE incluida durante el contrato');
      launcherStatus.textContent=preview?'Preview · sin consumo':'Voz LIVE · incluida';
      return;
    }
    const total=Math.max(1,Number(detail.totalSeconds||600));
    const remaining=Math.max(0,Math.min(total,Number(detail.remainingSeconds??total)));
    const elapsed=Math.min(10,Math.floor((total-remaining)/60));
    minuteLinks.forEach((link,index)=>link.classList.toggle('lit',index<elapsed));
    minuteChain.classList.toggle('exhausted',remaining===0);
    minuteChain.setAttribute('aria-valuenow',String(elapsed));
    minuteChain.setAttribute('aria-label',remaining===0?'Tiempo gratuito de Voz LIVE finalizado':`${Math.ceil(remaining/60)} minutos de Voz LIVE disponibles`);
    launcher.dataset.remainingMinutes=String(Math.ceil(remaining/60));
  };
  const requestVoiceStart=()=>frame.contentWindow?.postMessage({
    type:'secquoia:aggy:start-voice',
    version
  },'https://secquoia.net');
  let frameReady=false,frameAttempts=0,frameWatchdog=0;
  const showFrameState=(message,{retry=false}={})=>{
    frameStateCopy.textContent=message;
    frameRetry.hidden=!retry;
    frameState.querySelector('i').hidden=retry;
    frameState.hidden=false;
  };
  const markFrameReady=()=>{
    frameReady=true;
    clearTimeout(frameWatchdog);
    frameState.hidden=true;
  };
  const loadFrame=()=>{
    frameReady=false;
    frameAttempts+=1;
    showFrameState('Conectando la experiencia segura de Aggy…');
    const url=new URL(frameUrl);
    url.searchParams.set('load',String(frameAttempts));
    frame.src=url.href;
  };
  const watchFrame=()=>{
    clearTimeout(frameWatchdog);
    frameWatchdog=setTimeout(()=>{
      if(frameReady)return;
      if(frameAttempts<3)loadFrame();
      else showFrameState('No fue posible cargar Aggy. Revisa tu conexión y vuelve a intentarlo.',{retry:true});
    },8000);
  };
  const setOpen=(open,{focus=true}={})=>{
    panel.classList.toggle('open',open);
    launcher.setAttribute('aria-expanded',String(open));
    if(!focus)return;
    if(open)close.focus();
    else launcher.focus();
  };
  launcher.addEventListener('click',()=>{
    const opening=!panel.classList.contains('open');
    launcher.dataset.guideDismissed='true';
    setOpen(opening);
  });
  close.addEventListener('click',()=>setOpen(false));
  root.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!=='https://secquoia.net')return;
    if(event.data?.type==='secquoia:aggy:frame-ready'){
      markFrameReady();
      requestVoiceStart();
      return;
    }
    if(event.data?.type==='secquoia:aggy:qupay-checkout'){
      try{
        const checkoutUrl=new URL(String(event.data.checkoutUrl||''));
        if(checkoutUrl.protocol==='https:'&&checkoutUrl.hostname==='checkout.stripe.com'){
          setOpen(false,{focus:false});
          window.location.assign(checkoutUrl.href);
        }
      }catch{}
      return;
    }
    if(event.data?.type==='secquoia:aggy:usage-state'){
      updateMinuteChain(event.data);
      return;
    }
    if(event.data?.type!=='secquoia:aggy:voice-state')return;
    const state=['connecting','live','ready','blocked'].includes(event.data.state)?event.data.state:'ready';
    launcher.dataset.voice=state;
    const preview=launcher.dataset.accessMode==='ECOSYSTEM_PREVIEW';
    const included=launcher.dataset.accessMode==='CONTRACT_INCLUDED';
    launcherStatus.textContent=state==='connecting'
      ?'Conectando Voice LIVE…'
      :preview
        ?'Preview · sin consumo'
        :included
          ?'Voz LIVE · incluida'
          :state==='live'
      ?'EN VIVO · 10 min gratis'
        :state==='blocked'
          ?'Toca para activar · 10 min gratis'
          :'Voice LIVE · 10 min gratis';
  });
  frame.addEventListener('load',()=>{
    frame.dataset.ready='true';
    requestVoiceStart();
    watchFrame();
  });
  frameRetry.addEventListener('click',()=>{frameAttempts=0;loadFrame()});
  document.body.append(host);
  frameAttempts=1;
  watchFrame();
  requestAnimationFrame(()=>setOpen(false,{focus:false}));
})();
