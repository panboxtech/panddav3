// Abstração para trocar entre mock e Supabase real.
// Comentários para integração com Supabase: aqui deverão entrar a inicialização do cliente Supabase,
// URL e API KEY e mapeamento de tabelas: admins, clientes, planos, servidores, apps, assinaturas, pontosDeAcesso.
//
// Durante o protótipo usamos o Mock.
const DB = {
  getAll: (table) => Mock.getAll(table),
  insert: (table, rec) => Mock.insert(table, rec),
  update: (table, id, patch) => Mock.update(table, id, patch),
  remove: (table, id) => Mock.remove(table, id)
};
