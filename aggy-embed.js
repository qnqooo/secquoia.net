(()=>{
  'use strict';

  if(window.__SECQUOIA_AGGY_EMBED__)return;
  window.__SECQUOIA_AGGY_EMBED__=true;

  const script=document.currentScript;
  const site=script?.dataset.aggySite||location.hostname||'unknown';
  const version='1.0.0-rc.29';
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
      .panel{position:fixed;right:18px;bottom:76px;z-index:2147483647;width:min(390px,calc(100vw - 28px));height:min(650px,calc(100vh - 100px));border:1px solid rgba(255,255,255,.24);border-radius:24px;background:#06110b;box-shadow:0 24px 80px rgba(0,0,0,.58);overflow:hidden;opacity:0;transform:translateY(18px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease}
      .panel.open{opacity:1;transform:none;pointer-events:auto}
      .bar{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 15px;border-bottom:1px solid rgba(255,255,255,.12);background:#07180f;color:#effff5;font:850 12px/1 Inter,Segoe UI,Arial,sans-serif}
      .bar small{color:#9fb3a6;font-weight:700}
      .close{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font:900 18px/1 Arial;cursor:pointer}
      iframe{display:block;width:100%;height:calc(100% - 46px);border:0;background:#f4f7f6}
      @media(max-width:560px){.launcher{right:12px;bottom:12px}.panel{inset:8px;width:auto;height:auto;border-radius:20px}}
      @keyframes aggy-live-halo{0%{opacity:.72;transform:scale(.65)}75%,100%{opacity:0;transform:scale(1.75)}}
      @media(prefers-reduced-motion:reduce){.panel{transition:none}.dot::after{animation:none!important}}
    </style>
    <button class="launcher" type="button" data-voice="connecting" aria-expanded="false" aria-controls="aggy-panel" title="Aggy ${version}">
      <span class="dot" aria-hidden="true"></span><span class="launcher-copy"><strong>Aggy</strong><small>Conectando Voice LIVE…</small></span>
    </button>
    <section class="panel" id="aggy-panel" role="dialog" aria-label="Aggy, asistente de SECQUOIA">
      <div class="bar"><span>Aggy <small>${version}</small></span><button class="close" type="button" aria-label="Cerrar Aggy">×</button></div>
      <iframe title="Aggy Communications" src="${frameUrl}" allow="microphone; autoplay" sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation-by-user-activation"></iframe>
    </section>
  `;

  const launcher=root.querySelector('.launcher');
  const panel=root.querySelector('.panel');
  const close=root.querySelector('.close');
  const frame=root.querySelector('iframe');
  const launcherStatus=launcher.querySelector('small');
  const requestVoiceStart=()=>frame.contentWindow?.postMessage({
    type:'secquoia:aggy:start-voice',
    version
  },'https://secquoia.net');
  const setOpen=(open,{focus=true}={})=>{
    panel.classList.toggle('open',open);
    launcher.setAttribute('aria-expanded',String(open));
    if(!focus)return;
    if(open)close.focus();
    else launcher.focus();
  };
  launcher.addEventListener('click',()=>{
    const opening=!panel.classList.contains('open');
    setOpen(opening);
    if(!opening)return;
    if(frame.dataset.ready==='true')requestAnimationFrame(requestVoiceStart);
    else frame.addEventListener('load',requestVoiceStart,{once:true});
  });
  close.addEventListener('click',()=>setOpen(false));
  root.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!=='https://secquoia.net'||event.data?.type!=='secquoia:aggy:voice-state')return;
    const state=['connecting','live','ready','blocked'].includes(event.data.state)?event.data.state:'ready';
    launcher.dataset.voice=state;
    launcherStatus.textContent=state==='live'
      ?'EN VIVO · 5 min gratis'
      :state==='connecting'
        ?'Conectando Voice LIVE…'
        :state==='blocked'
          ?'Toca para activar · 5 min gratis'
          :'Voice LIVE · 5 min gratis';
  });
  frame.addEventListener('load',()=>{
    frame.dataset.ready='true';
    requestVoiceStart();
  });
  document.body.append(host);
  requestAnimationFrame(()=>setOpen(true,{focus:false}));
})();
