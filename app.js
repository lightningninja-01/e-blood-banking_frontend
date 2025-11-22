// app.js — frontend talking to Render backend
const BACKEND_URL = 'https://e-blood-banking.onrender.com';

const views = document.querySelectorAll('.view');
const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach(b => b.addEventListener('click', e => showView(e.target.dataset.view)));
function showView(id){
  views.forEach(v => v.id === 'view-'+id ? v.classList.add('active') : v.classList.remove('active'));
}

// Donor form
document.getElementById('donor-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const d = {
    name: document.getElementById('donor-name').value.trim(),
    age: Number(document.getElementById('donor-age').value),
    blood: document.getElementById('donor-group').value,
    contact: document.getElementById('donor-contact').value.trim()
  };
  await fetch(BACKEND_URL + '/donors', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(d) });
  alert('Donor registered (inventory +1).');
  e.target.reset(); loadDonors(); loadInventory();
});

document.getElementById('prefill-donor').addEventListener('click', async ()=>{
  const sample = { name:'John Doe', age:30, blood:'O+', contact:'9876543210' };
  await fetch(BACKEND_URL + '/donors', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sample) });
  loadDonors(); loadInventory();
});

// Request form
document.getElementById('request-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const req = {
    name: document.getElementById('req-name').value.trim(),
    blood: document.getElementById('req-group').value,
    qty: Number(document.getElementById('req-qty').value),
    loc: document.getElementById('req-loc').value.trim(),
    contact: document.getElementById('req-contact').value.trim()
  };
  const res = await fetch(BACKEND_URL + '/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req) });
  const data = await res.json();
  loadInventory();
  const el = document.getElementById('request-results');
  const item = document.createElement('div'); item.className = 'row-item';
  item.textContent = data.message || JSON.stringify(data);
  el.prepend(item);
  e.target.reset();
});

// Auto-match donors
document.getElementById('match-blood').addEventListener('click', async ()=>{
  const blood = document.getElementById('req-group').value;
  if(!blood) return alert('Select blood group first.');
  const donors = await fetch(BACKEND_URL + '/donors').then(r=>r.json());
  const matches = donors.filter(d => d.blood === blood);
  const el = document.getElementById('request-results'); el.innerHTML = '';
  if(!matches.length) el.textContent = 'No donors with that blood group found.';
  else matches.forEach(m => {
    const div = document.createElement('div'); div.className = 'row-item';
    div.innerHTML = `<div>${m.name} • ${m.contact}</div><div><button onclick="contactDonor('${m.contact}')">Contact</button></div>`;
    el.appendChild(div);
  });
});

window.contactDonor = function(contact){ alert('Contact: ' + contact + ' (demo)'); }

// Load donors
async function loadDonors(){
  const donors = await fetch(BACKEND_URL + '/donors').then(r=>r.json());
  const el = document.getElementById('donor-list'); el.innerHTML = '';
  donors.forEach(d=>{
    const div = document.createElement('div'); div.className='row-item';
    div.innerHTML = `<div><strong>${d.name}</strong> (${d.age}) • ${d.blood} • ${d.contact}</div><div><button onclick="deleteDonor('${d._id || d.id}')">Remove</button></div>`;
    el.appendChild(div);
  });
}

window.deleteDonor = async function(id){
  if(!confirm('Delete donor?')) return;
  await fetch(BACKEND_URL + '/donors/' + id, { method:'DELETE' });
  loadDonors();
}

// Inventory
async function loadInventory(filter){
  const inv = await fetch(BACKEND_URL + '/inventory').then(r=>r.json());
  const invList = document.getElementById('inventory-list'); invList.innerHTML = '';
  Object.entries(inv).forEach(([g,q])=>{
    if(filter && filter !== g) return;
    const div = document.createElement('div'); div.className = 'row-item';
    div.innerHTML = `<div><strong>${g}</strong> — ${q} unit(s)</div>
      <div><button onclick="changeUnits('${g}',1)">+1</button><button onclick="changeUnits('${g}',-1)">-1</button></div>`;
    invList.appendChild(div);
  });
  const dash = document.getElementById('dash-inv'); dash.innerHTML = ''; Object.entries(inv).forEach(([g,q])=>{ const p=document.createElement('div'); p.textContent=`${g}: ${q}`; dash.appendChild(p) });
}

window.changeUnits = async function(group, delta){
  if(delta > 0) await fetch(BACKEND_URL + '/inventory/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ group, qty: delta })});
  else await fetch(BACKEND_URL + '/inventory/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ group, qty: Math.abs(delta) })});
  loadInventory(document.getElementById('search-group').value);
}

document.getElementById('search-group').addEventListener('change', (e)=> loadInventory(e.target.value));
document.getElementById('reset-sample').addEventListener('click', async ()=>{
  alert('To reset inventory, edit the backend inventory doc or re-deploy with defaults.');
});

// init
showView('home');
loadInventory();
loadDonors();
