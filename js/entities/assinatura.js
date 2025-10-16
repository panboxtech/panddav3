// entidade assinatura e rotina de renovação
export const Assinatura = {
  async list(){ return DB.getAll('assinaturas'); },
  async getByCliente(clienteId){ const all = await DB.getAll('assinaturas'); return all.find(a=>a.cliente===clienteId) || null; },
  async update(id, patch){ return DB.update('assinaturas', id, patch); },

  // Renew calcula a nova data de vencimento a partir de dataAtualVencimento e validadeEmMeses
  renew(assinatura, validadeEmMeses){
    const original = new Date(assinatura.dataDeVencimento);
    const day = original.getDate();
    // soma meses
    const targetMonthIndex = original.getMonth() + validadeEmMeses; // 0-based
    const targetYear = original.getFullYear() + Math.floor(targetMonthIndex / 12);
    const targetMonth = targetMonthIndex % 12;

    // tenta criar data com mesmo dia
    const tentativa = new Date(targetYear, targetMonth, day);
    if(tentativa.getMonth() === targetMonth){
      return tentativa.toISOString();
    } else {
      // dia não existe no mês alvo -> dia 1 do mês seguinte ao mês alvo
      const proximoMes = new Date(targetYear, targetMonth + 1, 1);
      return proximoMes.toISOString();
    }
  }
};
