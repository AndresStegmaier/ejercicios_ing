const RAMOS = {
  calculo_diferencial:{nombre:"Cálculo Diferencial e Integral",archivo:"calculo_diferencial.json"},
  algebra_lineal:{nombre:"Álgebra Lineal",archivo:"algebra_lineal.json"},
  calculo_basico:{nombre:"Cálculo Básico",archivo:"calculo_basico.json"},
  algebra_basica:{nombre:"Álgebra Básica",archivo:"algebra_basica.json"},
  quimica_general:{nombre:"Química General",archivo:"quimica_general.json"},
  programacion:{nombre:"Programación",archivo:"programacion.json"}
};

let ramoActual="calculo_diferencial", nivelActual=1, banco=[], ejercicio=null;
const $=s=>document.querySelector(s);

function crearTabs(){
  $("#ramos").innerHTML=Object.entries(RAMOS).map(([id,r])=>`<button class="tab ${id===ramoActual?"active":""}" data-ramo="${id}">${r.nombre}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b=>b.onclick=async()=>{ramoActual=b.dataset.ramo;crearTabs();actualizarSubtemas();await cargarBanco();limpiar();});
}
async function cargarBanco(){
  try{const r=await fetch(`ejercicios/${RAMOS[ramoActual].archivo}`); banco=await r.json();}
  catch(e){banco=[]; console.error(e);}
  $("#contador").textContent=`Banco: ${banco.filter(x=>+x.nivel===+nivelActual).length} + generadores`;
}
function actualizarSubtemas(){
  const wrap=$("#subtemaWrap");
  if(ramoActual!=="quimica_general"){wrap.classList.add("hidden");return;}
  wrap.classList.remove("hidden");
  const temas=[...new Set(banco.map(x=>x.subtema).filter(Boolean))];
  $("#subtema").innerHTML=`<option value="todos">Todos</option>`+temas.map(x=>`<option>${x}</option>`).join("");
}
function limpiar(){
  ejercicio=null;$("#answer").classList.add("hidden");$("#respuestaBtn").disabled=true;
  $("#exercise").innerHTML=`<div class="placeholder"><div class="placeholder-icon">∑</div><h2>Listo para practicar</h2><p>Presiona <b>Generar ejercicio</b>.</p></div>`;
  $("#badgeRamo").textContent=RAMOS[ramoActual].nombre;$("#badgeNivel").textContent=`Nivel ${nivelActual}`;
}
function generadoresDisponibles(){
  return GENERADORES.filter(g=>g.ramo===ramoActual && +g.nivel===+nivelActual);
}
function generar(){
  let candidatos=banco.filter(x=>+x.nivel===+nivelActual);
  if(ramoActual==="quimica_general"){
    const st=$("#subtema").value;
    if(st && st!=="todos") candidatos=candidatos.filter(x=>x.subtema===st);
  }

  const gens=generadoresDisponibles();

  // Si los JSON no pudieron cargarse (por ejemplo, al abrir index.html
  // directamente con file://), los generadores matemáticos siguen funcionando.
  if(!candidatos.length && !gens.length){
    $("#exercise").innerHTML=`<div class="placeholder"><div class="placeholder-icon">!</div><h2>No se pudo cargar el banco</h2><p>Si estás trabajando localmente, abre la página mediante un servidor local o súbela a GitHub Pages.</p></div>`;
    $("#answer").classList.add("hidden");
    $("#respuestaBtn").disabled=true;
    $("#contador").textContent="Banco no disponible";
    return;
  }

  const usarGen=gens.length && (Math.random()<0.65 || !candidatos.length);
  if(usarGen){
    const g=pick(gens);
    const z=g.make();
    ejercicio={tema:g.tema,pregunta:z.q,respuesta:z.a};
  }else{
    const z=candidatos[Math.floor(Math.random()*candidatos.length)];
    ejercicio={tema:z.subtema||z.tema||"Ejercicio",pregunta:z.pregunta,respuesta:z.respuesta};
  }

  $("#exercise").innerHTML=`<div class="question"><div class="topic">${ejercicio.tema}</div>${ejercicio.pregunta}</div>`;
  $("#answer").classList.add("hidden");
  $("#respuestaBtn").disabled=false;
  $("#answer").innerHTML=`<div class="answer-title">Respuesta</div>${ejercicio.respuesta}`;
  $("#contador").textContent=`Banco: ${candidatos.length} · Generadores: ${gens.length}`;
}
function iniciarApp(){
  $("#nivel").onchange=async e=>{nivelActual=+e.target.value;$("#badgeNivel").textContent=`Nivel ${nivelActual}`;await cargarBanco();actualizarSubtemas();limpiar();};
  $("#nuevo").onclick=generar;
  $("#otro").onclick=generar;
  $("#respuestaBtn").onclick=()=>$("#answer").classList.toggle("hidden");
  $("#subtema").onchange=limpiar;
  crearTabs();
  (async()=>{await cargarBanco();actualizarSubtemas();limpiar();})();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", iniciarApp);
}else{
  iniciarApp();
}
