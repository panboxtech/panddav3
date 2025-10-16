// entidade cliente com validações relacionadas a telas e pontos de acesso
export const Cliente = {
  async list(){ return DB.getAll('clientes'); },
  async getById(id){ const all = await DB.getAll('clientes'); return all.find(c=>c.id===id) || null; },
  async insert(payload){ return DB.insert('clientes', payload); },
  async update(id, patch){ return DB.update('clientes', id, patch); },

  // retorna soma de pontosSimultaneos para um cliente
  async sumPontos(clienteId){
    const pontos = await DB.getAll('pontosDeAcesso');
    return pontos.filter(p=>p.cliente===clienteId).reduce((s,p)=>s+Number(p.pontosSimultaneos||0),0);
  },

  // valida que soma pontos == telas
  async validaTelasIgualPontos(clienteId, telas){
    const soma = await Cliente.sumPontos(clienteId);
    return Number(soma) === Number(telas);
  }
};
