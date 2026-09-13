
const fs=require("fs"),vm=require("vm");global.window=global;
vm.runInThisContext(fs.readFileSync("js/banco100.js","utf8"));
const cases=[
 ["calculo_diferencial","Regla de la cadena"],
 ["calculo_diferencial","Derivación implícita"],
 ["algebra_lineal","Diagonalización"],
 ["calculo_multivariable","Hessiano y extremos"],
 ["fisica","Trabajo y energía"],
 ["estadistica","Probabilidad"],
 ["programacion","Bucles"]
];
for(const [r,s] of cases){
 console.log("\\n"+r+" / "+s);
 for(const n of [1,3,5,6]){
  const e=Banco100.generarIndice(r,n,s,11);
  console.log("L"+n+": "+String(e.pregunta).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,240));
 }
}
