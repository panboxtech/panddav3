// entidade plano
export const Plano = {
  async list(){ return DB.getAll('planos'); },
  async getById(id){ const all = await DB.getAll('planos'); return all.find(p=>p.id===id) || null; }
};
