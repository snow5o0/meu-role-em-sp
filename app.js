const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "meuRoleSP_v1";
let places = [];
let proposal = [];
let timerInterval = null;
let timerStartedAt = null;
let timerElapsed = 0;
let activePlace = null;

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function getTripData() {
  const ids = ["origin","departureDate","departureTime","intercityMode","arrivalDate","arrivalTime","arrivalPlace","arrivalAddress","hotelName","hotelAddress","checkin","checkout","flightDate","flightTime","airport","terminal","flightNumber"];
  return Object.fromEntries(ids.map(id => [id, $(id).value.trim()]));
}
function saveAll() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({places, trip:getTripData()}));
}
function loadAll() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    places = Array.isArray(data.places) ? data.places : [];
    if (data.trip) Object.entries(data.trip).forEach(([id,value]) => { if ($(id)) $(id).value = value || ""; });
  } catch(e) { places = []; }
  renderPlaces(); updateHome();
}
function showTab(name) {
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === name));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.goto)));

function cleanLines(text) {
  return text.split(/\r?\n/)
    .map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(s => s.length > 2)
    .filter(s => !/^(roteiro|dia \d+|manhã|tarde|noite|almoço|observações?)$/i.test(s));
}
function addPlaces(names) {
  const known = new Set(places.map(p => p.name.toLocaleLowerCase("pt-BR")));
  names.forEach(name => {
    const clean = name.replace(/\s+/g," ").replace(/[.;,]$/,"").trim();
    if (clean.length > 2 && !known.has(clean.toLocaleLowerCase("pt-BR"))) {
      places.push({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), name:clean, address:"", duration:60, day:1});
      known.add(clean.toLocaleLowerCase("pt-BR"));
    }
  });
  saveAll(); renderPlaces(); updateHome();
}
$("parseButton").addEventListener("click", () => {
  const names = cleanLines($("routeText").value);
  if (!names.length) return toast("Cole um local por linha para começar.");
  addPlaces(names); toast(names.length + " linha(s) analisada(s). Confira os locais identificados.");
});
$("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2_000_000) return toast("Arquivo muito grande. Envie um TXT de até 2 MB.");
  try { $("routeText").value = await file.text(); toast("Arquivo carregado. Toque em Ler roteiro."); }
  catch(err) { toast("Não foi possível ler esse arquivo."); }
});
$("addPlaceButton").addEventListener("click", () => {
  const name = prompt("Qual é o nome do local que deseja visitar?");
  if (name && name.trim()) { addPlaces([name.trim()]); toast("Local adicionado."); }
});
function renderPlaces() {
  $("placeCount").textContent = places.length + (places.length === 1 ? " local" : " locais");
  const list = $("placeList");
  if (!places.length) { list.className="place-list empty"; list.textContent="Seus locais aparecerão aqui depois da importação."; }
  else {
    list.className="place-list";
    list.innerHTML = places.map((p,i)=>`<div class="place-item"><span class="place-number">${i+1}</span><div class="place-info"><b>${escapeHTML(p.name)}</b><small>Endereço a confirmar · ${p.duration} min sugeridos</small></div><button class="remove-place" data-remove="${p.id}" aria-label="Remover ${escapeHTML(p.name)}">×</button></div>`).join("");
    list.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{places=places.filter(p=>p.id!==btn.dataset.remove);saveAll();renderPlaces();updateHome();}));
  }
  const map = $("mapPlaces");
  if (!places.length) { map.className="place-list empty"; map.textContent="Os atalhos para os locais aparecerão aqui."; }
  else {
    map.className="place-list";
    map.innerHTML = places.map(p=>`<div class="place-item"><span class="place-number">⌖</span><div class="place-info"><b>${escapeHTML(p.name)}</b><small>Pesquisar endereço e opções de rota</small></div><a class="text-button" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+', São Paulo, SP')}">Abrir mapa ↗</a></div>`).join("");
  }
}
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function updateHome() {
  if (places.length) {
    $("nextTitle").textContent = places[0].name;
    $("nextMeta").textContent = "Primeiro local da lista · confirme data e horário no roteiro.";
    $("nextStatus").textContent = "Roteiro preparado";
  } else {
    $("nextTitle").textContent = "Seu primeiro rolê começa aqui.";
    $("nextMeta").textContent = "Importe ou cadastre os locais que deseja visitar.";
    $("nextStatus").textContent = "Aguardando roteiro";
  }
}
$("optimizeButton").addEventListener("click", () => {
  if (places.length < 2) return toast("Adicione pelo menos dois locais para criar uma sugestão.");
  proposal = [...places].sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  const box = $("proposal");
  const hotel = $("hotelAddress").value.trim() || $("hotelName").value.trim();
  box.classList.remove("hidden");
  box.innerHTML = `<p class="eyebrow">PRÉVIA DE ORGANIZAÇÃO</p><h3>Sugestão para revisar</h3><p class="muted">A lista abaixo é uma organização preliminar por nome, não uma rota geográfica calculada. Para otimizar de verdade, precisamos confirmar endereços e integrar um serviço de rotas.</p>${hotel?`<p class="hint">Hotel informado: ${escapeHTML(hotel)}. Ele será considerado ponto de retorno no planejamento completo.</p>`:`<p class="hint">Informe o endereço do hotel na aba Viagem para incluí-lo como ponto de retorno.</p>`}<ol>${proposal.map(p=>`<li>${escapeHTML(p.name)}</li>`).join("")}</ol><div class="proposal-actions"><button class="button secondary" id="rejectProposal">Manter original</button><button class="button primary" id="acceptProposal">Aprovar prévia</button></div>`;
  $("rejectProposal").addEventListener("click",()=>{box.classList.add("hidden");toast("Roteiro original mantido.");});
  $("acceptProposal").addEventListener("click",()=>{places=proposal;saveAll();renderPlaces();updateHome();box.classList.add("hidden");toast("Prévia salva. A ordem geográfica será calculada na próxima etapa.");});
  box.scrollIntoView({behavior:"smooth",block:"center"});
});
$("saveTrip").addEventListener("click",()=>{
  saveAll(); $("saveFeedback").textContent="Dados salvos neste aparelho."; updateMapLinks(); toast("Dados da viagem salvos.");
});
function updateMapLinks() {
  const hotel = $("hotelAddress").value.trim() || $("hotelName").value.trim();
  const airport = $("airport").value.trim();
  const h=$("hotelMapLink"), a=$("airportMapLink");
  if(hotel){h.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(hotel+", São Paulo");h.classList.remove("disabled");}
  if(airport){a.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(airport);a.classList.remove("disabled");}
}
$("timerButton").addEventListener("click",()=>{
  if(timerInterval){clearInterval(timerInterval);timerInterval=null;$("timerButton").textContent="Continuar";return;}
  if(!timerStartedAt) timerStartedAt=Date.now()-timerElapsed;
  $("timerButton").textContent="Pausar";
  timerInterval=setInterval(()=>{
    timerElapsed=Date.now()-timerStartedAt;
    const sec=Math.floor(timerElapsed/1000), h=String(Math.floor(sec/3600)).padStart(2,"0"),m=String(Math.floor(sec%3600/60)).padStart(2,"0"),s=String(sec%60).padStart(2,"0");
    $("timerDisplay").textContent=`${h}:${m}:${s}`;
  },250);
});
$("todayLabel").textContent = new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date()).toUpperCase();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
loadAll(); updateMapLinks();
