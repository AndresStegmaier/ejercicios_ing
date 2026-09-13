
const fs=require("fs"),vm=require("vm");
global.window=global;
vm.runInThisContext(fs.readFileSync("js/banco100.js","utf8"));

const S={
 calculo_diferencial:["Derivadas","Regla de la cadena","Derivación implícita","Tasas de cambio","Integrales indefinidas","Integrales definidas","Sustitución","Integración por partes"],
 algebra_lineal:["Matrices y operaciones","Determinantes","Inversas","Sistemas lineales","Vectores y espacios","Valores propios","Diagonalización"],
 calculo_basico:["Ecuaciones","Potencias y radicales","Exponenciales y logaritmos","Trigonometría","Dominio","Inecuaciones"],
 algebra_basica:["Factorización","Productos notables","Fracciones algebraicas","Polinomios","Valor absoluto","Inecuaciones","Sistemas"],
 quimica_general:["Configuración electrónica","Electronegatividad","Fuerzas intermoleculares","Balanceo","Polaridad y geometría"],
 calculo_multivariable:["Derivadas parciales","Gradiente y derivada direccional","Plano tangente y linealización","Hessiano y extremos","Integrales dobles y triples","Cambio de variables y polares","Multiplicadores de Lagrange"],
 fisica:["Cinemática","Dinámica y fuerzas","Trabajo y energía","Momento y colisiones","Movimiento circular y rotación","Electricidad y circuitos","Fluidos","Oscilaciones","Calor y termodinámica","Gravitación"],
 estadistica:["Estadística descriptiva","Probabilidad","Variables aleatorias","Distribución binomial","Distribución normal","Inferencia estadística","Correlación y regresión"],
 programacion:["Variables y operadores","Condicionales","Bucles","Listas y comprensiones","Diccionarios","Funciones","Archivos y JSON","Excepciones","Programación orientada a objetos"]
};
const sinAplicados=new Set(["programacion","fisica","estadistica"]);
let combinaciones=0,entradas=0,fallos=[],minUnicos=100,minInfo=null;
for(const [ramo,subs] of Object.entries(S)){
 const niveles=[1,2,3,4,5,6,...(sinAplicados.has(ramo)?[]:["aplicados"])];
 for(const nivel of niveles) for(const st of subs){
   combinaciones++;
   const n=Banco100.contar(ramo,nivel,st);
   const u=Banco100.contarUnicos(ramo,nivel,st);
   entradas+=n;
   if(u<minUnicos){minUnicos=u;minInfo={ramo,nivel,subtema:st};}
   if(n!==100 || u!==100) fallos.push({ramo,nivel,subtema:st,n,u});
 }
}
console.log(JSON.stringify({combinaciones,entradas,fallos:fallos.length,minimo_variantes_textuales_distintas:minUnicos,minInfo},null,2));
if(fallos.length) process.exit(2);
