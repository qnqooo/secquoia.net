(()=>{
  'use strict';

  const MAX_ROWS=500;
  const fields=[
    ['product','Producto'],
    ['measurement','Medición'],
    ['scope','Alcance'],
    ['baseRateUsd','Tarifa base'],
    ['licenseAccessUsd','Licencia / acceso'],
    ['protectedCapacityUsd','Capacidad protegida'],
    ['securityGovernanceUsd','Gobierno QuFense / QuSOC'],
    ['quhubProvisioningUsd','Provisión QuHub'],
    ['evidenceSupportUsd','Evidencia / soporte'],
    ['commercialReserveUsd','Reserva comercial'],
    ['salePriceUsd','Precio de venta']
  ];

  const money=value=>Number.isFinite(Number(value))
    ?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value))
    :'—';

  const clear=node=>{while(node.firstChild)node.firstChild.remove()};

  const cell=(tag,value,className)=>{
    const node=document.createElement(tag);
    node.textContent=String(value??'—').slice(0,160);
    if(className)node.className=className;
    return node;
  };

  const renderLocked=target=>{
    clear(target);
    const notice=document.createElement('section');
    notice.className='qucfa-module-locked';
    notice.setAttribute('role','status');
    notice.textContent='QuCFA bloqueado: requiere sesión autenticada, autorización por rol y datos emitidos por el backend.';
    target.append(notice);
  };

  const mount=(target,context={})=>{
    if(!(target instanceof Element))throw new TypeError('qucfa_target_required');
    const authorized=context.authenticated===true&&context.authorized===true;
    if(!authorized){
      renderLocked(target);
      return Object.freeze({mounted:false,reason:'AUTHORIZATION_REQUIRED'});
    }

    const rows=Array.isArray(context.rows)?context.rows.slice(0,MAX_ROWS):[];
    clear(target);
    const shell=document.createElement('section');
    shell.className='qucfa-commercial-process-module';
    shell.dataset.module='qucfa-commercial-process-v1';

    const heading=document.createElement('header');
    heading.append(
      cell('span','QUCFA · INTERNAL'),
      cell('h2','Economía comercial por producto'),
      cell('p','Módulo interno. Los datos provienen del backend de QuCFA y no se publican en el Marketplace.')
    );
    shell.append(heading);

    const wrap=document.createElement('div');
    wrap.className='qucfa-table-wrap';
    const table=document.createElement('table');
    table.className='qucfa-process-table';
    const thead=document.createElement('thead');
    const headRow=document.createElement('tr');
    fields.forEach(([,label])=>headRow.append(cell('th',label)));
    thead.append(headRow);
    table.append(thead);

    const tbody=document.createElement('tbody');
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      fields.forEach(([key])=>{
        const numeric=key.endsWith('Usd');
        tr.append(cell('td',numeric?money(row?.[key]):row?.[key],numeric?'num':''));
      });
      tbody.append(tr);
    });
    if(!rows.length){
      const tr=document.createElement('tr');
      const td=cell('td','Sin datos autorizados para mostrar.');
      td.colSpan=fields.length;
      tr.append(td);
      tbody.append(tr);
    }
    table.append(tbody);
    wrap.append(table);
    shell.append(wrap);
    target.append(shell);

    return Object.freeze({
      mounted:true,
      rowCount:rows.length,
      truncated:Array.isArray(context.rows)&&context.rows.length>MAX_ROWS,
      generatedAt:String(context.generatedAt||new Date().toISOString())
    });
  };

  window.QuCFADashboardModules=Object.freeze({
    commercialProcess:Object.freeze({version:'1.0.0',mount})
  });
})();
