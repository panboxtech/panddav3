// Mock provider simula Supabase para desenvolvimento
// Observação: campos com ** (id, dataDeCriacao/dataDeCadastro/dataDeVencimento) devem ser gerados no Supabase em produção.

const Mock = (function(){
  let nextId = 100;
  function genId(){ return String(nextId++); }

  // mocks iniciais
  const planos = [
    { id: '1', nome: 'Mensal', validadeEmMeses: 1 },
    { id: '2', nome: 'Trimestral', validadeEmMeses: 3 },
    { id: '3', nome: 'Anual', validadeEmMeses: 12 }
  ];

  const servidores = [
    { id: '1', nome: 'Servidor A', dataDeCriacao: new Date().toISOString() },
    { id: '2', nome: 'Servidor B', dataDeCriacao: new Date().toISOString() }
  ];

  const apps = [
    { id: '1', nome: 'App Android', multiplosAcessos: false, servidor: '1', dataDeCriacao: new Date().toISOString() },
    { id: '2', nome: 'App Web', multiplosAcessos: true, servidor: '1', dataDeCriacao: new Date().toISOString() }
  ];

  const clientes = [
    { id: '10', Nome: 'Marcos Silva', telefone: '55999888777', email:'m@ex.com', dataDeCriacao: new Date().toISOString(), plano: '1', servidor1:'1', servidor2:null, acessos: null, bloqueado:false }
  ];

  const assinaturas = [
    // id gerado por supabase em produção
    { id: '20', cliente: '10', plano: '1', dataDeVencimento: new Date(Date.now() + 2*24*3600*1000).toISOString(), dataDePagamento: null, formaDePagamento: 'pix', telas: 2, valor: 9.9 }
  ];

  const pontosDeAcesso = [
    { id:'30', cliente:'10', servidor:'1', app:'1', pontosSimultaneos:1 },
    { id:'31', cliente:'10', servidor:'1', app:'2', pontosSimultaneos:1 }
  ];

  return {
    planos, servidores, apps, clientes, assinaturas, pontosDeAcesso,
    async getAll(table){
      await new Promise(r=>setTimeout(r,80));
      return JSON.parse(JSON.stringify(this[table] || []));
    },
    async insert(table, rec){
      const r = JSON.parse(JSON.stringify(rec));
      r.id = genId();
      if(table === 'clientes' || table === 'servidores' || table === 'apps') r.dataDeCriacao = new Date().toISOString();
      this[table].push(r);
      return r;
    },
    async update(table, id, patch){
      const arr = this[table];
      const idx = arr.findIndex(x=>x.id===id);
      if(idx === -1) throw new Error('Não encontrado');
      Object.assign(arr[idx], patch);
      return JSON.parse(JSON.stringify(arr[idx]));
    },
    async remove(table, id){
      const arr = this[table];
      const idx = arr.findIndex(x=>x.id===id);
      if(idx === -1) throw new Error('Não encontrado');
      const r = arr.splice(idx,1)[0];
      return r;
    }
  };
})();
