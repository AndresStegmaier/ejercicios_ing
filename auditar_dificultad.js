
const fs=require("fs"),vm=require("vm");global.window=global;
vm.runInThisContext(fs.readFileSync("js/banco100.js","utf8"));
const checks=[
 ["calculo_diferencial","Derivación implícita"],
 ["calculo_diferencial","Regla de la cadena"],
 ["algebra_lineal","Determinantes"],
 ["calculo_basico","Ecuaciones"],
 ["calculo_multivariable","Derivadas parciales"],
 ["fisica","Cinemática"],
 ["estadistica","Estadística descriptiva"],
 ["programacion","Bucles"]
];
for(const [r,s] of checks){
 console.log("\\n"+r+" / "+s);
 for(let n=1;n<=6;n++){
  const e=Banco100.generarIndice(r,n,s,7);
  console.log("L"+n+": "+String(e.pregunta).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,180));
 }
}
