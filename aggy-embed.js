(()=>{
  'use strict';

  if(window.__SECQUOIA_AGGY_EMBED__)return;
  window.__SECQUOIA_AGGY_EMBED__=true;

  const script=document.currentScript;
  const site=script?.dataset.aggySite||location.hostname||'unknown';
  const version='1.0.0-rc.8';
  const frameUrl=`https://secquoia.net/aggy-widget.html?site=${encodeURIComponent(site)}&v=${encodeURIComponent(version)}`;
  const host=document.createElement('div');
  host.id='secquoia-aggy-embed';
  const root=host.attachShadow({mode:'open'});

  root.innerHTML=`
    <style>
      :host{all:initial}
      *{box-sizing:border-box}
      .launcher{position:fixed;right:18px;bottom:18px;z-index:2147483646;display:flex;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:linear-gradient(135deg,#35ff8c,#00c76a);color:#031008;padding:12px 17px;font:900 14px/1 Inter,Segoe UI,Arial,sans-serif;box-shadow:0 14px 46px rgba(0,0,0,.38);cursor:pointer}
      .launcher:focus-visible,.close:focus-visible{outline:3px solid #fff;outline-offset:3px}
      .dot{width:9px;height:9px;border-radius:50%;background:#031008;box-shadow:0 0 0 4px rgba(3,16,8,.14)}
      .panel{position:fixed;right:18px;bottom:76px;z-index:2147483647;width:min(390px,calc(100vw - 28px));height:min(650px,calc(100vh - 100px));border:1px solid rgba(255,255,255,.24);border-radius:24px;background:#06110b;box-shadow:0 24px 80px rgba(0,0,0,.58);overflow:hidden;opacity:0;transform:translateY(18px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease}
      .panel.open{opacity:1;transform:none;pointer-events:auto}
      .bar{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 15px;border-bottom:1px solid rgba(255,255,255,.12);background:#07180f;color:#effff5;font:850 12px/1 Inter,Segoe UI,Arial,sans-serif}
      .bar small{color:#9fb3a6;font-weight:700}
      .close{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font:900 18px/1 Arial;cursor:pointer}
      iframe{display:block;width:100%;height:calc(100% - 46px);border:0;background:#06110b}
      @media(max-width:560px){.launcher{right:12px;bottom:12px}.panel{inset:8px;width:auto;height:auto;border-radius:20px}}
      @media(prefers-reduced-motion:reduce){.panel{transition:none}}
    </style>
    <button class="launcher" type="button" aria-expanded="false" aria-controls="aggy-panel" title="Aggy ${version}">
      <span class="dot" aria-hidden="true"></span><span>Aggy</span>
    </button>
    <section class="panel" id="aggy-panel" role="dialog" aria-label="Aggy, asistente de SECQUOIA">
      <div class="bar"><span>Aggy <small>${version}</small></span><button class="close" type="button" aria-label="Cerrar Aggy">×</button></div>
      <iframe title="Aggy Voice" src="${frameUrl}" allow="microphone; autoplay" sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation-by-user-activation"></iframe>
    </section>
  `;

  const launcher=root.querySelector('.launcher');
  const panel=root.querySelector('.panel');
  const close=root.querySelector('.close');
  const setOpen=open=>{
    panel.classList.toggle('open',open);
    launcher.setAttribute('aria-expanded',String(open));
    if(open)close.focus();
    else launcher.focus();
  };
  launcher.addEventListener('click',()=>setOpen(!panel.classList.contains('open')));
  close.addEventListener('click',()=>setOpen(false));
  root.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
  document.body.append(host);
})();
