(()=>{
  'use strict';

  if(window.__SECQUOIA_AGGY_EMBED__)return;
  window.__SECQUOIA_AGGY_EMBED__=true;

  const script=document.currentScript;
  const site=script?.dataset.aggySite||location.hostname||'unknown';
  const autoOpen=script?.dataset.aggyAutoOpen!=='false';
  const version='1.3.0-rc.1';
  const assetRevision='1.3.0-rc.1-paidresume-20260801';
  const paymentReturn=(()=>{
    try{
      const values=new URLSearchParams(location.hash.replace(/^#/,''));
      const sessionId=String(values.get('session_id')||'');
      if(values.get('aggy_payment')!=='success'||!/^cs_live_[A-Za-z0-9_]{16,200}$/.test(sessionId))return '';
      const receiptKey=`secquoia.aggy.payment-return.${sessionId}`;
      let alreadyAcknowledged=false;
      try{alreadyAcknowledged=sessionStorage.getItem(receiptKey)==='1'}catch{}
      const sanitized=new URL(location.href);
      sanitized.hash='';
      history.replaceState(history.state,'',sanitized.href);
      if(alreadyAcknowledged)return '';
      try{sessionStorage.setItem(receiptKey,'1')}catch{}
      return sessionId;
    }catch{return ''}
  })();
  const compactContextText=(value,max=180)=>String(value||'')
    .replace(/\s+/g,' ')
    .replace(/(?:bearer|api[_ -]?key|access[_ -]?token|secret|password|contraseña|cvv|cvc)\s*[:=]\s*\S+/ig,'[REDACTED]')
    .trim()
    .slice(0,max);
  const uniqueContextValues=(values,limit=12)=>[...new Set(values.map(value=>compactContextText(value)).filter(Boolean))].slice(0,limit);
  const readHostContext=()=>{
    const read=(selector,limit)=>uniqueContextValues([...document.querySelectorAll(selector)]
      .filter(element=>!element.closest('#secquoia-aggy-embed')&&!element.closest('form,[contenteditable="true"]'))
      .map(element=>element.textContent),limit);
    const title=compactContextText(document.title,140);
    const description=compactContextText(document.querySelector('meta[name="description"]')?.content,240);
    const headings=read('main h1,main h2,main h3,body>h1,body>h2,[data-aggy-context]',18);
    const navigation=read('nav a,nav button,[role="navigation"] a,[role="navigation"] button',12);
    const capabilities=uniqueContextValues([
      script?.dataset.aggyProduct,
      script?.dataset.aggyService,
      script?.dataset.aggyCapability,
      document.body?.dataset.aggyContext
    ],8);
    const corpus=normalizeContext(`${site} ${title} ${description} ${headings.join(' ')} ${capabilities.join(' ')}`);
    const roles=[];
    if(/deploy|despleg|implement|install|instal|integrat|integra|connector|conector|onboard|provision/.test(corpus))roles.push('IMPLEMENTATION');
    if(/support|soporte|help|ayuda|incident|incidente|alert|monitor|soc|operation|operacion|status|estado/.test(corpus))roles.push('SUPPORT');
    if(/price|precio|pricing|plan|product|producto|service|servicio|market|mercado|buy|comprar|quote|cotiz|cost|costo|licen|venta/.test(corpus))roles.push('COMMERCIAL');
    if(/technology|tecnologia|technical|tecnico|cyber|ciber|security|seguridad|pqc|api|architecture|arquitectura|platform|plataforma|dashboard|engine|motor/.test(corpus))roles.push('TECHNICAL');
    if(!roles.length)roles.push('TECHNICAL','COMMERCIAL','SUPPORT','IMPLEMENTATION');
    return Object.freeze({
      schema:'secquoia.aggy.host-context.v1',
      site:compactContextText(site,80),
      page:Object.freeze({origin:location.origin,pathname:location.pathname.slice(0,180),title,description,language:compactContextText(document.documentElement.lang||navigator.language,16)}),
      signals:Object.freeze({headings,navigation,capabilities}),
      roles:Object.freeze([...new Set(roles)]),
      capturedAt:new Date().toISOString(),
      privacy:Object.freeze({formValuesCaptured:false,bodyDumped:false,queryStringCaptured:false,secretsRedacted:true})
    });
  };
  const normalizeContext=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const frameUrl=(()=>{
    const url=new URL('https://secquoia.net/qu-market.html');
    url.searchParams.set('embed','1');
    url.searchParams.set('aggy','1');
    url.searchParams.set('site',site);
    url.searchParams.set('v',assetRevision);
    if(paymentReturn)url.hash=new URLSearchParams({payment:'success',session_id:paymentReturn}).toString();
    return url.href;
  })();
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
      .launcher[data-expired="true"]{background:linear-gradient(135deg,#ffe9a8,#ffc24f);color:#161000;border-color:rgba(78,52,0,.2)}
      .launcher[data-expired="true"] .launcher-nudge{display:block;background:linear-gradient(135deg,#fff3c9,#ffd979);color:#261900;border-color:#fff6d8;animation:none}
      .launcher[data-expired="true"] .launcher-nudge::after{border-top-color:#ffd979}
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
      .continuity{position:fixed;right:18px;bottom:76px;z-index:2147483647;width:min(390px,calc(100vw - 28px));border:1px solid rgba(93,64,0,.2);border-radius:22px;background:#fffaf0;color:#172019;box-shadow:0 24px 80px rgba(0,0,0,.5);padding:20px;font:700 12px/1.45 Inter,Segoe UI,Arial,sans-serif}
      .continuity[hidden]{display:none}
      .continuity-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
      .continuity h2{margin:0;font:900 20px/1.15 Inter,Segoe UI,Arial,sans-serif;color:#171000}
      .continuity p{margin:8px 0 16px;color:#59635d;font-weight:650}
      .continuity-close{display:grid;place-items:center;flex:0 0 auto;width:32px;height:32px;border:0;border-radius:50%;background:#efe7d5;color:#171000;font:900 18px/1 Arial;cursor:pointer}
      .continuity-chat{width:100%;min-height:46px;border:0;border-radius:13px;background:#093f2d;color:#fff;font:850 12px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
      .continuity-label{display:block;margin:16px 0 8px;color:#56430b;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
      .continuity-packs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .continuity-pack{display:grid;gap:2px;min-height:58px;padding:9px;border:1px solid #e0c777;border-radius:12px;background:#fff;color:#151008;text-align:left;font:850 12px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
      .continuity-pack small{color:#6c6450;font-size:9px;font-weight:700}
      .continuity-pack.recommended{background:#fff1bd;border-color:#dcaa19}
      .continuity-note{display:block;margin-top:11px;color:#726950;font-size:9px;font-weight:650}
      .payment-moment{position:fixed;right:18px;bottom:92px;z-index:2147483647;width:min(410px,calc(100vw - 28px));overflow:hidden;border:1px solid rgba(6,97,66,.18);border-radius:24px;background:linear-gradient(145deg,#f7fffb 0%,#e8fff5 54%,#e9f5ff 100%);color:#071b13;box-shadow:0 28px 90px rgba(0,32,20,.34);font:700 12px/1.45 Inter,Segoe UI,Arial,sans-serif;animation:aggy-payment-arrive .5s cubic-bezier(.2,.85,.2,1)}
      .payment-moment[hidden]{display:none}
      .payment-glow{position:absolute;right:-42px;top:-56px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(53,255,140,.38),transparent 67%);pointer-events:none}
      .payment-body{position:relative;padding:20px}
      .payment-kicker{display:flex;align-items:center;gap:8px;color:#08724c;font-size:10px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
      .payment-check{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#0ecb7d;color:#fff;box-shadow:0 0 0 7px rgba(14,203,125,.11);font-size:13px}
      .payment-moment h2{margin:14px 0 5px;font:950 23px/1.05 Inter,Segoe UI,Arial,sans-serif;letter-spacing:-.025em}
      .payment-moment p{margin:0;color:#52655c;font-weight:650}
      .payment-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
      .payment-stat{padding:11px;border:1px solid rgba(7,75,51,.1);border-radius:14px;background:rgba(255,255,255,.72)}
      .payment-stat small{display:block;color:#6c7c74;font-size:9px;text-transform:uppercase;letter-spacing:.08em}
      .payment-stat strong{display:block;margin-top:3px;color:#073e2c;font-size:17px}
      .payment-route{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:6px;margin:0 0 16px;color:#08724c;font-size:9px}
      .payment-route i{width:8px;height:8px;border-radius:50%;background:#13d487;box-shadow:0 0 0 4px rgba(19,212,135,.12)}
      .payment-route span{height:2px;border-radius:999px;background:linear-gradient(90deg,#13d487,#55a9ff);transform-origin:left;animation:aggy-route-fill .8s .18s both}
      .payment-actions{display:grid;grid-template-columns:1fr auto;gap:8px}
      .payment-primary,.payment-later{min-height:44px;border-radius:13px;font:900 11px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
      .payment-primary{border:0;background:linear-gradient(135deg,#11db8a,#36a6ff);color:#04140e;box-shadow:0 10px 24px rgba(23,160,124,.2)}
      .payment-later{border:1px solid rgba(7,75,51,.14);background:rgba(255,255,255,.65);color:#345047;padding:0 14px}
      @media(max-width:560px){.launcher{right:12px;bottom:12px}.panel{inset:8px;width:auto;height:auto;border-radius:20px}.continuity,.payment-moment{right:8px;bottom:78px;width:calc(100vw - 16px)}.continuity-packs{grid-template-columns:repeat(2,minmax(0,1fr))}.payment-body{padding:17px}.payment-moment h2{font-size:21px}}
      @keyframes aggy-live-halo{0%{opacity:.72;transform:scale(.65)}75%,100%{opacity:0;transform:scale(1.75)}}
      @keyframes aggy-guide-pulse{50%{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,74,180,.46)}}
      @keyframes aggy-final-minute{to{transform:scaleY(1.8);filter:brightness(1.28)}}
      @keyframes aggy-frame-spin{to{transform:rotate(360deg)}}
      @keyframes aggy-payment-arrive{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
      @keyframes aggy-route-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
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
    <section class="payment-moment" role="status" aria-live="polite" aria-label="Pago confirmado y Tiempo IA disponible" hidden>
      <span class="payment-glow" aria-hidden="true"></span>
      <div class="payment-body">
        <div class="payment-kicker"><span class="payment-check" aria-hidden="true">✓</span><span>Pago confirmado</span></div>
        <h2>Tu conversación continúa.</h2>
        <p data-payment-copy>Aggy está reactivando Voice LIVE para retomar exactamente donde quedaron.</p>
        <div class="payment-stats"><div class="payment-stat"><small>Pago recibido</small><strong data-payment-amount>USD —</strong></div><div class="payment-stat"><small>Voice LIVE</small><strong data-payment-minutes>— minutos</strong></div></div>
        <div class="payment-route" aria-label="Pago confirmado, Tiempo IA activado, Aggy lista"><i></i><span></span><i></i><span></span><i></i></div>
        <div class="payment-actions"><button class="payment-primary" type="button" hidden>Reintentar Voice LIVE</button><button class="payment-later" type="button">Ahora no</button></div>
      </div>
    </section>
    <section class="continuity" role="dialog" aria-modal="true" aria-labelledby="aggy-continuity-title" hidden>
      <div class="continuity-head"><div><h2 id="aggy-continuity-title">Tu tiempo gratis finalizó</h2><p>Continúa por Chat seguro o elige Tiempo IA para seguir conversando por voz.</p></div><button class="continuity-close" type="button" aria-label="Cerrar">×</button></div>
      <button class="continuity-chat" type="button">Continuar por Chat seguro</button>
      <strong class="continuity-label">Tiempo IA · pago único</strong>
      <div class="continuity-packs">
        <button class="continuity-pack recommended" type="button" data-pack="qvit-ai-credit-1"><strong>USD 1</strong><small>5 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-5"><strong>USD 5</strong><small>25 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-10"><strong>USD 10</strong><small>50 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-25"><strong>USD 25</strong><small>125 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-50"><strong>USD 50</strong><small>250 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-100"><strong>USD 100</strong><small>500 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-500"><strong>USD 500</strong><small>2.500 min Voice LIVE</small></button>
        <button class="continuity-pack" type="button" data-pack="qvit-ai-credit-1000"><strong>USD 1.000</strong><small>5.000 min Voice LIVE</small></button>
      </div>
      <small class="continuity-note">Sin renovación automática. El Marketplace mostrará el detalle antes del pago.</small>
    </section>
  `;

  const launcher=root.querySelector('.launcher');
  const panel=root.querySelector('.panel');
  const close=root.querySelector('.close');
  const frame=root.querySelector('iframe');
  const publishHostContext=()=>frame.contentWindow?.postMessage({type:'secquoia:aggy:host-context',context:readHostContext(),version},'https://secquoia.net');
  const frameState=root.querySelector('.frame-state');
  const frameStateCopy=frameState.querySelector('span');
  const frameRetry=frameState.querySelector('button');
  const continuity=root.querySelector('.continuity');
  const continuityClose=root.querySelector('.continuity-close');
  const continuityChat=root.querySelector('.continuity-chat');
  const paymentMoment=root.querySelector('.payment-moment');
  const paymentAmount=paymentMoment.querySelector('[data-payment-amount]');
  const paymentMinutes=paymentMoment.querySelector('[data-payment-minutes]');
  const paymentCopy=paymentMoment.querySelector('[data-payment-copy]');
  const paymentPrimary=paymentMoment.querySelector('.payment-primary');
  const paymentLater=paymentMoment.querySelector('.payment-later');
  const launcherStatus=launcher.querySelector('small');
  const launcherNudge=launcher.querySelector('.launcher-nudge');
  const minuteChain=launcher.querySelector('.minute-chain');
  const minuteLinks=[...launcher.querySelectorAll('.minute-link')];
  let paymentMomentTimer=0;
  let paymentActivationPending=false;
  let paymentReturnRecoveryShown=false;
  let paymentWindow=null;
  let usageMarketplaceUrl='https://secquoia.net/qu-market.html?time_ai=1#ai-services';
  const setContinuityOpen=open=>{
    continuity.hidden=!open;
    launcher.setAttribute('aria-expanded',String(open||panel.classList.contains('open')));
    if(open)continuityClose.focus();
  };
  const timeAiCheckoutUrlFor=packId=>{
    const url=new URL('https://secquoia.net/aggy-time-ai.html');
    url.searchParams.set('pack',packId);
    url.searchParams.set('return_to',window.location.href);
    try{
      const source=new URL(usageMarketplaceUrl);
      const walletReference=String(source.searchParams.get('wallet_ref')||'');
      if(/^[A-Za-z0-9_-]{43}$/.test(walletReference))url.searchParams.set('wallet_ref',walletReference);
    }catch{}
    return url.href;
  };
  const openTimeAiCheckout=url=>{
    paymentWindow=window.open(url,'secquoia-aggy-payment','popup,width=540,height=760');
    if(paymentWindow)return true;
    window.location.assign(url);
    return false;
  };
  const setPaymentMomentOpen=open=>{
    paymentMoment.hidden=!open;
    clearTimeout(paymentMomentTimer);
    if(open)paymentMomentTimer=setTimeout(()=>{paymentMoment.hidden=true},12000);
  };
  const showPaymentMoment=detail=>{
    const amount=Number(detail.amountUsd||0);
    const minutes=Math.round(Number(detail.voiceLiveMinutes||0));
    if(!(minutes>0&&minutes<=100000))return;
    paymentAmount.textContent=amount>0&&amount<=100000?`USD ${amount.toFixed(2)}`:'Confirmado';
    paymentMinutes.textContent=`${minutes} minutos`;
    launcher.dataset.expired='false';
    launcher.dataset.continuityRequired='false';
    launcher.dataset.paidAvailable='true';
    launcher.dataset.paidMinutes=String(minutes);
    launcherStatus.textContent='Pago confirmado · reactivando Voice LIVE…';
    launcherNudge.textContent=amount>0?`USD ${amount.toFixed(2)} · ${minutes} min acreditados`:`${minutes} min acreditados`;
    paymentCopy.textContent='Pago certificado. Aggy está reactivando Voice LIVE automáticamente.';
    paymentPrimary.hidden=true;
    paymentActivationPending=true;
    setOpen(false,{focus:false});
    setPaymentMomentOpen(true);
    requestVoiceStart();
  };
  const updateMinuteChain=detail=>{
    const contractIncluded=['CONTRACT_INCLUDED','ECOSYSTEM_PREVIEW'].includes(detail.accessMode);
    const paidAvailable=detail.paidAvailable===true;
    launcher.dataset.accessMode=String(detail.accessMode||'VISITOR_TRIAL');
    launcher.dataset.paidAvailable=String(paidAvailable);
    if(Number.isFinite(Number(detail.paidMinutes))&&Number(detail.paidMinutes)>0)launcher.dataset.paidMinutes=String(Math.floor(Number(detail.paidMinutes)));
    minuteChain.classList.toggle('contract',contractIncluded);
    if(contractIncluded){
      const preview=detail.accessMode==='ECOSYSTEM_PREVIEW';
      launcher.dataset.expired='false';
      launcher.dataset.continuityRequired='false';
      minuteChain.setAttribute('aria-label',preview?'Acceso Ecosystem Preview sin consumo':'Voz LIVE incluida durante el contrato');
      launcherStatus.textContent=preview?'Preview · sin consumo':'Voz LIVE · incluida';
      return;
    }
    if(paidAvailable){
      const paidMinutes=Number(launcher.dataset.paidMinutes||0);
      launcher.dataset.expired='false';
      launcher.dataset.continuityRequired='false';
      minuteLinks.forEach(link=>link.classList.remove('lit'));
      minuteChain.classList.remove('exhausted');
      minuteChain.setAttribute('aria-label','Tiempo IA pagado disponible');
      launcherStatus.textContent=paidMinutes>0?`${paidMinutes} min disponibles · Voice LIVE`:'Tiempo IA disponible · continuar';
      launcherNudge.textContent='Un toque para activar Voice LIVE';
      if(paymentReturn&&!paymentReturnRecoveryShown&&paidMinutes>0){
        paymentReturnRecoveryShown=true;
        showPaymentMoment({voiceLiveMinutes:paidMinutes});
      }
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
    launcher.dataset.expired=String(remaining===0);
    launcher.dataset.continuityRequired=String(remaining===0);
    if(remaining===0){
      launcher.dataset.voice='blocked';
      launcherStatus.textContent='Tiempo gratis agotado · continuar';
      launcherNudge.textContent='Chat seguro o paquetes de Tiempo IA';
    }else{
      launcherNudge.textContent='Toca aquí: chat, archivos y llamadas seguras';
    }
    try{
      const candidate=new URL(String(detail.marketplaceUrl||''));
      if(candidate.protocol==='https:'&&candidate.hostname==='secquoia.net'&&candidate.pathname==='/qu-market.html')usageMarketplaceUrl=candidate.href;
    }catch{}
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
    if(open)setContinuityOpen(false);
    panel.classList.toggle('open',open);
    launcher.setAttribute('aria-expanded',String(open));
    if(!focus)return;
    if(open)close.focus();
    else launcher.focus();
  };
  launcher.addEventListener('click',()=>{
    launcher.dataset.guideDismissed='true';
    const continuityRequired=
      launcher.dataset.continuityRequired==='true'||
      launcher.dataset.expired==='true'||
      /agotado|finaliz/i.test(launcherStatus.textContent||'');
    if(continuityRequired){
      setOpen(false,{focus:false});
      setContinuityOpen(true);
      return;
    }
    if(launcher.dataset.paidAvailable==='true'){
      launcherStatus.textContent='Conectando Voice LIVE…';
      setOpen(false,{focus:false});
      requestVoiceStart();
      return;
    }
    const opening=!panel.classList.contains('open');
    setOpen(opening);
  });
  close.addEventListener('click',()=>setOpen(false));
  continuityClose.addEventListener('click',()=>{setContinuityOpen(false);launcher.focus()});
  continuityChat.addEventListener('click',()=>{
    setContinuityOpen(false);
    setOpen(true);
    frame.contentWindow?.postMessage({type:'secquoia:aggy:open-chat',version},'https://secquoia.net');
  });
  paymentPrimary.addEventListener('click',()=>{
    setPaymentMomentOpen(false);
    launcherStatus.textContent='Conectando Voice LIVE…';
    setOpen(false,{focus:false});
    requestVoiceStart();
  });
  paymentLater.addEventListener('click',()=>setPaymentMomentOpen(false));
  window.addEventListener('pagehide',()=>setPaymentMomentOpen(false));
  window.addEventListener('pageshow',event=>{if(event.persisted)setPaymentMomentOpen(false)});
  continuity.addEventListener('click',event=>{
    const pack=event.target.closest('[data-pack]')?.dataset.pack;
    if(!/^qvit-ai-credit-(1|5|10|25|50|100|500|1000)$/.test(pack||''))return;
    setContinuityOpen(false);
    openTimeAiCheckout(timeAiCheckoutUrlFor(pack));
  });
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){setContinuityOpen(false);setOpen(false)}});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!=='https://secquoia.net')return;
    if(event.data?.type==='secquoia:aggy:frame-ready'){
      markFrameReady();
      publishHostContext();
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
    if(event.data?.type==='secquoia:aggy:open-time-ai'){
      try{
        const marketplaceUrl=new URL(String(event.data.marketplaceUrl||''));
        if(marketplaceUrl.protocol==='https:'&&marketplaceUrl.hostname==='secquoia.net'&&marketplaceUrl.pathname==='/aggy-time-ai.html'){
          setOpen(false,{focus:false});
          setContinuityOpen(true);
        }
      }catch{}
      return;
    }
    if(event.data?.type==='secquoia:aggy:usage-state'){
      updateMinuteChain(event.data);
      return;
    }
    if(event.data?.type==='secquoia:aggy:payment-confirmed'){
      showPaymentMoment(event.data);
      return;
    }
    if(event.data?.type!=='secquoia:aggy:voice-state')return;
    const state=['connecting','live','ready','blocked'].includes(event.data.state)?event.data.state:'ready';
    launcher.dataset.voice=state;
    const preview=launcher.dataset.accessMode==='ECOSYSTEM_PREVIEW';
    const included=launcher.dataset.accessMode==='CONTRACT_INCLUDED';
    const paidAvailable=launcher.dataset.paidAvailable==='true';
    const paidMinutes=Number(launcher.dataset.paidMinutes||0);
    const expired=launcher.dataset.expired==='true';
    launcher.dataset.voice=expired?'blocked':state;
    if(state==='live'){
      paymentActivationPending=false;
      setPaymentMomentOpen(false);
    }else if(state==='blocked'&&paidAvailable&&paymentActivationPending){
      paymentPrimary.textContent='Reintentar Voice LIVE';
      paymentPrimary.hidden=false;
      paymentCopy.textContent='El navegador no permitió completar el audio automáticamente. Reintenta sin realizar otro pago.';
      launcherNudge.textContent='Reintenta Voice LIVE · no pagues nuevamente';
      setPaymentMomentOpen(true);
    }
    launcherStatus.textContent=expired
      ?'Tiempo gratis agotado · continuar'
      :state==='connecting'
      ?'Conectando Voice LIVE…'
      :paidAvailable
        ?state==='live'?'EN VIVO · Tiempo IA':paidMinutes>0?`${paidMinutes} min disponibles · Voice LIVE`:'Tiempo IA disponible · continuar'
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
  window.addEventListener('message',event=>{
    if(event.origin!=='https://secquoia.net'||event.source!==paymentWindow||event.data?.type!=='secquoia:aggy:payment-handoff')return;
    const walletBinding=String(event.data.walletBinding||'');
    const confirmation=event.data.confirmation||{};
    if(!/^[A-Za-z0-9_-]{80,900}\.[0-9a-f]{64}$/i.test(walletBinding))return;
    if(confirmation.schema!=='secquoia.qupay.aggy-payment-handoff.v1'||!(Number(confirmation.amountUsd)>0)||!(Number(confirmation.voiceLiveMinutes)>0))return;
    frame.contentWindow?.postMessage({type:'secquoia:aggy:payment-handoff',walletBinding,confirmation,version},'https://secquoia.net');
    paymentWindow=null;
  });
  frame.addEventListener('load',()=>{
    frame.dataset.ready='true';
    publishHostContext();
    requestVoiceStart();
    watchFrame();
  });
  frameRetry.addEventListener('click',()=>{frameAttempts=0;loadFrame()});
  document.body.append(host);
  frameAttempts=1;
  watchFrame();
  requestAnimationFrame(()=>setOpen(autoOpen,{focus:false}));
})();
