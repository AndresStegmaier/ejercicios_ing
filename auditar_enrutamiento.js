
const fs=require("fs"),vm=require("vm");global.window=global;
vm.runInThisContext(fs.readFileSync("js/banco100.js","utf8"));

const casos=[
 ["calculo_diferencial","Regla de la cadena"],
 ["calculo_diferencial","Derivación implícita"],
 ["algebra_lineal","Determinantes"],
 ["calculo_basico","Ecuaciones"],
 ["fisica","Cinemática"],
 ["estadistica","Estadística descriptiva"],
 ["programacion","Bucles"]
];

for(const [r,s] of casos){
 console.log("\n"+r+" / "+s);
 for(const n of [1,2,3,4,5,6]){
  const e=Banco100.generarIndice(r,n,s,9);
  console.log(`L${n}: ${String(e.pregunta).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,180)}`);
 }
}
console.log("\nTODOS NIVEL 1 - 10 muestras");
for(let i=0;i<10;i++){
 const e=Banco100.generarTodos("calculo_diferencial",1);
 console.log(String(e.tema)+" :: "+String(e.pregunta).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,130));
}
