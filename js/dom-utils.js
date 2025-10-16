// Helpers para criar DOM sem innerHTML
function createEl(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const k in props) {
    if (k === 'text') el.textContent = props[k];
    else if (k === 'html') el.innerHTML = props[k]; // uso mínimo e controlado; evitar com dados do usuário
    else el.setAttribute(k, props[k]);
  }
  if (!Array.isArray(children)) children = [children];
  children.forEach(c => { if (!c) return; if (typeof c === 'string') el.appendChild(document.createTextNode(c)); else el.appendChild(c); });
  return el;
}

function clearChildren(el){ while (el.firstChild) el.removeChild(el.firstChild); }

function toast(msg, ms = 3500){
  const t = createEl('div',{class:'toast',text:msg});
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), ms);
}

function formatDateISO(date){
  if(!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${day}/${m}/${y}`;
}

function parseISOToDate(str){
  return str ? new Date(str) : null;
}
