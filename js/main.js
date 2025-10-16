// Inicialização do app: carrega rota clientes por padrão
document.addEventListener('DOMContentLoaded', ()=>{
  // load default
  document.querySelectorAll('.topbar nav button').forEach(b=>{
    b.addEventListener('click', ()=> {
      const route = b.getAttribute('data-route');
      if(route) loadRoute(route);
    });
  });
  loadRoute('clientes');
});
