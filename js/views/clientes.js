// controller da view clientes (não usa innerHTML para conteúdo dinâmico)
(async function(){
  // import simulado (módulos não nativos neste protótipo simples)
  const PlanoSvc = window.Plano || window.Plano; // placeholder
  // elementos
  const tableBody = document.querySelector('#clientes-table tbody');
  const tpl = document.querySelector('#client-row-template');
  const filterSelect = document.getElementById('filter-select');
  const orderSelect = document.getElementById('order-select');
  const btnNew = document.getElementById('btn-new-client');
  const modal = document.getElementById('client-form-modal');
  const fNome = document.getElementById('f-nome');
  const fTel = document.getElementById('f-tel');
  const fPlano = document.getElementById('f-plano');
  const fServidor1 = document.getElementById('f-servidor1');
  const fTelas = document.getElementById('f-telas');
  const btnAddPonto = document.getElementById('btn-add-ponto');
  const pontosList = document.getElementById('pontos-list');
  const btnSave = document.getElementById('btn-save-client');
  const btnCancel = document.getElementById('btn-cancel-client');
  const formError = document.getElementById('form-error');

  // carregar dados auxiliares
  async function loadAux(){
    const [planos, servidores, apps] = await Promise.all([DB.getAll('planos'), DB.getAll('servidores'), DB.getAll('apps')]);
    clearChildren(fPlano);
    planos.forEach(p=> fPlano.appendChild(createEl('option',{value:p.id,text:`${p.nome} (${p.validadeEmMeses}m)` })));
    clearChildren(fServidor1);
    servidores.forEach(s=> fServidor1.appendChild(createEl('option',{value:s.id,text:s.nome})));
    return {planos, servidores, apps};
  }

  let aux = await loadAux();

  async function loadClients(){
    clearChildren(tableBody);
    const [clientes, assinaturas, planos] = await Promise.all([DB.getAll('clientes'), DB.getAll('assinaturas'), DB.getAll('planos')]);
    // join básico por cliente
    const rows = clientes.map(c=>{
      const a = assinaturas.find(x=>x.cliente===c.id) || null;
      const p = planos.find(x=>x.id === (a ? a.plano : c.plano)) || null;
      return { cliente: c, assinatura: a, plano: p };
    });

    // aplicar filtro
    const today = new Date();
    const filter = filterSelect.value;
    function daysDiff(dateIso){
      if(!dateIso) return Infinity;
      const d = new Date(dateIso);
      return Math.floor((d - today) / (24*3600*1000));
    }
    let filtered = rows.filter(r=> r.assinatura !== null );
    if(filter === 'vencendo') filtered = filtered.filter(r => { const d = daysDiff(r.assinatura.dataDeVencimento); return d >=0 && d <= 3; });
    if(filter === 'vencidos30') filtered = filtered.filter(r => { const d = daysDiff(r.assinatura.dataDeVencimento); return d < 0 && d > -30; });
    if(filter === 'vencidos') filtered = filtered.filter(r => { const d = daysDiff(r.assinatura.dataDeVencimento); return d < 0; });

    // ordenar
    const order = orderSelect.value;
    filtered.sort((a,b)=>{
      if(order === 'nome') return a.cliente.Nome.localeCompare(b.cliente.Nome);
      const av = a.assinatura ? new Date(a.assinatura.dataDeVencimento).getTime() : 0;
      const bv = b.assinatura ? new Date(b.assinatura.dataDeVencimento).getTime() : 0;
      return av - bv;
    });

    // render
    filtered.forEach(r=>{
      const tr = tpl.content.cloneNode(true);
      const rowEl = tr.querySelector('tr');
      tr.querySelector('.td-nome').textContent = r.cliente.Nome;
      tr.querySelector('.td-tel').textContent = r.cliente.telefone;
      tr.querySelector('.td-plano').textContent = r.plano ? r.plano.nome : '-';
      tr.querySelector('.td-venc').textContent = r.assinatura ? formatDateISO(r.assinatura.dataDeVencimento) : '-';
      tr.querySelector('.td-telas').textContent = r.assinatura ? String(r.assinatura.telas) : '-';

      // progresso soma/telas
      const soma = (DB.getAll('pontosDeAcesso').then(list=> list.filter(p=>p.cliente===r.cliente.id).reduce((s,p)=>s+Number(p.pontosSimultaneos||0),0)));
      soma.then(sum=>{
        const container = tr.querySelector('.td-progress');
        const wrap = createEl('div');
        const txt = createEl('div',{text:`${sum}/${r.assinatura ? r.assinatura.telas : 0}`});
        const bar = createEl('div',{class:'progress-bar'});
        const fill = createEl('div',{class:'progress-fill'});
        const perc = r.assinatura && r.assinatura.telas ? Math.min(100, Math.round(sum / r.assinatura.telas * 100)) : 0;
        fill.style.width = perc + '%';
        bar.appendChild(fill);
        wrap.appendChild(txt);
        wrap.appendChild(bar);
        container.appendChild(wrap);
      });

      // ações
      const actionsTd = tr.querySelector('.td-actions');
      const btnEdit = createEl('button',{class:'btn small',text:'Editar'});
      btnEdit.addEventListener('click', ()=> openEdit(r.cliente.id));
      const btnBlock = createEl('button',{class:'btn small warn',text: r.cliente.bloqueado ? 'Desbloquear' : 'Bloquear'});
      btnBlock.addEventListener('click', async ()=>{
        await DB.update('clientes', r.cliente.id, { bloqueado: !r.cliente.bloqueado });
        toast('Status atualizado');
        loadClients();
      });

      const btnWhatsapp = createEl('button',{class:'btn small',text:'WhatsApp'});
      btnWhatsapp.addEventListener('click', ()=>{
        const firstName = r.cliente.Nome.split(' ')[0] || r.cliente.Nome;
        const msg = `Olá ${firstName}, seu acesso está vencendo, para renovar`;
        const phone = r.cliente.telefone.replace(/\D/g,'');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url,'_blank');
      });

      const btnRenew = createEl('button',{class:'btn small primary',text:'Renovar'});
      btnRenew.addEventListener('click', async ()=>{
        if(!r.assinatura || !r.plano) { toast('Assinatura ou plano não encontrado'); return; }
        const nova = Assinatura.renew(r.assinatura, Number(r.plano.validadeEmMeses));
        // se mudou para dia 1 do mês seguinte devemos informar (Assinatura.renew já aplica regra)
        // verificar se o dia original existe no mês alvo
        await DB.update('assinaturas', r.assinatura.id, { dataDeVencimento: nova });
        toast(`Renovado: ${formatDateISO(nova)}`);
        loadClients();
      });

      const btnDelete = createEl('button',{class:'btn small danger',text:'Excluir'});
      btnDelete.addEventListener('click', async ()=>{
        // apenas master deveria excluir: neste protótipo não há autenticação completa
        if(!confirm('Confirmar exclusão do cliente?')) return;
        await DB.remove('clientes', r.cliente.id);
        // remover assinaturas e pontos vinculados (simplicidade)
        const assinaturas = await DB.getAll('assinaturas');
        for(const a of assinaturas.filter(x=>x.cliente===r.cliente.id)) await DB.remove('assinaturas', a.id);
        const pontos = await DB.getAll('pontosDeAcesso');
        for(const p of pontos.filter(x=>x.cliente===r.cliente.id)) await DB.remove('pontosDeAcesso', p.id);
        toast('Cliente excluído');
        loadClients();
      });

      actionsTd.appendChild(btnEdit);
      actionsTd.appendChild(btnBlock);
      actionsTd.appendChild(btnWhatsapp);
      actionsTd.appendChild(btnRenew);
      actionsTd.appendChild(btnDelete);

      tableBody.appendChild(rowEl);
    });
  }

  // criação de UI para pontos de acesso no formulário
  function createPontoRow(appsList){
    const row = createEl('div',{class:'row'},[]);
    const sel = createEl('select',{class:'input'});
    appsList.forEach(a=> sel.appendChild(createEl('option',{value:a.id,text:a.nome})));
    const input = createEl('input',{class:'input',type:'number',placeholder:'pontosSimultaneos',min:1});
    const btnRem = createEl('button',{class:'btn',text:'Remover'});
    btnRem.addEventListener('click', ()=> row.remove());
    row.appendChild(sel); row.appendChild(input); row.appendChild(btnRem);
    return row;
  }

  // handlers do modal
  btnNew.addEventListener('click', async ()=>{
    modal.style.display = 'block';
    document.getElementById('form-title').textContent = 'Novo Cliente';
    fNome.value=''; fTel.value=''; fTelas.value='1';
    clearChildren(pontosList);
  });

  btnCancel.addEventListener('click', ()=> { modal.style.display = 'none'; });

  btnAddPonto.addEventListener('click', async ()=>{
    const apps = await DB.getAll('apps');
    pontosList.appendChild(createPontoRow(apps));
  });

  btnSave.addEventListener('click', async ()=>{
    formError.textContent='';
    const payload = { Nome: fNome.value.trim(), telefone: fTel.value.trim(), plano: fPlano.value, servidor1: fServidor1.value, dataDeCriacao: new Date().toISOString(), bloqueado:false };
    if(!payload.Nome || !payload.telefone) { formError.textContent='Nome e telefone são obrigatórios'; return; }
    const telas = Number(fTelas.value || 0);
    if(telas <= 0){ formError.textContent='Telas deve ser maior que zero'; return; }
    // salvar cliente
    const newC = await DB.insert('clientes', payload);
    // criar assinatura básica
    const assinatura = { cliente: newC.id, plano: payload.plano, dataDeVencimento: new Date().toISOString(), telas, valor:0 };
    const savedA = await DB.insert('assinaturas', assinatura);
    // criar pontos de acesso do formulário
    const pontoRows = Array.from(pontosList.querySelectorAll('div.row'));
    for(const pr of pontoRows){
      const sel = pr.querySelector('select');
      const inp = pr.querySelector('input');
      await DB.insert('pontosDeAcesso', { cliente: newC.id, servidor: fServidor1.value, app: sel.value, pontosSimultaneos: Number(inp.value || 1) });
    }
    // validar soma == telas
    const soma = (await DB.getAll('pontosDeAcesso')).filter(p=>p.cliente===newC.id).reduce((s,p)=>s+Number(p.pontosSimultaneos||0),0);
    if(soma !== telas){
      formError.textContent = `Soma de pontos (${soma}) difere de telas (${telas}). Ajuste antes de continuar.`;
      // manter dados mas não permitir continuar (simples notificação)
      return;
    }
    toast('Cliente criado');
    modal.style.display = 'none';
    loadClients();
  });

  // abrir edição simples
  async function openEdit(clienteId){
    modal.style.display = 'block';
    document.getElementById('form-title').textContent = 'Editar Cliente';
    const c = (await DB.getAll('clientes')).find(x=>x.id===clienteId);
    const a = (await DB.getAll('assinaturas')).find(x=>x.cliente===clienteId);
    fNome.value = c.Nome; fTel.value = c.telefone; fTelas.value = a ? a.telas : 1;
    // carregar pontos
    clearChildren(pontosList);
    const pontos = (await DB.getAll('pontosDeAcesso')).filter(p=>p.cliente===clienteId);
    const apps = await DB.getAll('apps');
    pontos.forEach(p=>{
      const row = createPontoRow(apps);
      row.querySelector('select').value = p.app;
      row.querySelector('input').value = p.pontosSimultaneos;
      pontosList.appendChild(row);
    });

    btnSave.onclick = async ()=>{
      formError.textContent='';
      const updated = { Nome: fNome.value.trim(), telefone: fTel.value.trim() };
      await DB.update('clientes', clienteId, updated);
      // atualizar assinatura telas
      if(a){
        const newTelas = Number(fTelas.value||0);
        await DB.update('assinaturas', a.id, { telas: newTelas });
      }
      // atualizar pontos: simplificamos removendo existentes e inserindo novas
      const existentes = (await DB.getAll('pontosDeAcesso')).filter(p=>p.cliente===clienteId);
      for(const p of existentes) await DB.remove('pontosDeAcesso', p.id);
      const pontoRows = Array.from(pontosList.querySelectorAll('div.row'));
      for(const pr of pontoRows){
        const sel = pr.querySelector('select');
        const inp = pr.querySelector('input');
        await DB.insert('pontosDeAcesso', { cliente: clienteId, servidor: fServidor1.value, app: sel.value, pontosSimultaneos: Number(inp.value || 1) });
      }
      // validar soma vs telas
      const soma = (await DB.getAll('pontosDeAcesso')).filter(p=>p.cliente===clienteId).reduce((s,p)=>s+Number(p.pontosSimultaneos||0),0);
      const newTelas = Number(fTelas.value||0);
      if(soma !== newTelas){
        formError.textContent = `Soma de pontos (${soma}) difere de telas (${newTelas}). Ajuste antes de salvar.`;
        return;
      }
      toast('Cliente atualizado');
      modal.style.display = 'none';
      loadClients();
    };
  }

  // eventos filtros
  filterSelect.addEventListener('change', loadClients);
  orderSelect.addEventListener('change', loadClients);

  // inicial
  loadClients();
})();
