// Router simples baseado em data-route
const routes = {
  clientes: { view: 'views/view-clientes.html', controller: 'js/views/clientes.js' },
  planos: { view: null, controller: null },
  servidores: { view: null, controller: null },
  admin: { view: null, controller: null }
};

async function loadRoute(name){
  const root = document.getElementById('app-root');
  root.innerHTML = '';
  if(!routes[name] || !routes[name].view){
    root.appendChild(createEl('div',{class:'card',text:'Página em construção'}));
    return;
  }
  const res = await fetch(routes[name].view);
  const html = await res.text();
  // inserir HTML da view de forma segura
  const container = createEl('div');
  container.innerHTML = html; // view html é estática controlada pelo projeto
  root.appendChild(container);

  // carregar script da view
  if(routes[name].controller){
    const s = document.createElement('script');
    s.src = routes[name].controller;
    document.body.appendChild(s);
  }
}

document.addEventListener('click', (ev)=>{
  const r = ev.target.closest('[data-route]');
  if(r){ loadRoute(r.getAttribute('data-route')); }
});
