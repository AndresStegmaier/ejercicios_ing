/* Generadores matemáticos: 24 tipos.
   Se usan como complemento de los bancos JSON. */
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr => arr[rand(0,arr.length-1)];
const sign = n => n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;

function fr(a,b){ if(b<0){a=-a;b=-b} const g=(x,y)=>y?g(y,x%y):Math.abs(x); const d=g(a,b); return `${a/d}/${b/d}`; }
function powText(base,exp){return `${base}<sup>${exp}</sup>`}

const GENERADORES = [
  {id:"derivada_pol",ramo:"calculo_diferencial",nivel:1,tema:"Derivadas",make(){let a=rand(2,9),b=rand(1,9),c=rand(1,9);return {q:`Calcula la derivada de f(x) = ${a}x² ${sign(b)}x ${sign(c)}.`,a:`f'(x) = ${2*a}x ${sign(b)}.`}}},
  {id:"derivada_pot",ramo:"calculo_diferencial",nivel:1,tema:"Derivadas",make(){let a=rand(2,8),n=rand(2,5);return {q:`Calcula la derivada de f(x) = ${a}x<sup>${n}</sup>.`,a:`f'(x) = ${a*n}x<sup>${n-1}</sup>.`}}},
  {id:"producto",ramo:"calculo_diferencial",nivel:2,tema:"Regla del producto",make(){let a=rand(2,5),b=rand(2,5);return {q:`Deriva f(x) = (x² + ${a})(x + ${b}).`,a:`f'(x) = 3x² + ${2*b}x + ${a}.`}}},
  {id:"cociente",ramo:"calculo_diferencial",nivel:2,tema:"Regla del cociente",make(){let b=rand(1,5),c=rand(1,5);return {q:`Calcula d/dx [(x + ${b})/(x + ${c})].`,a:`f'(x) = (${c} - ${b})/(x + ${c})².`}}},
  {id:"cadena",ramo:"calculo_diferencial",nivel:2,tema:"Regla de la cadena",make(){let a=rand(2,5),b=rand(2,6);return {q:`Calcula la derivada de f(x) = (${a}x + ${b})³.`,a:`f'(x) = ${3*a}(${a}x + ${b})².`}}},
  {id:"implicita",ramo:"calculo_diferencial",nivel:3,tema:"Derivación implícita",make(){let a=rand(1,4),b=rand(1,4);return {q:`Encuentra dy/dx si x² + ${a}xy + y² = 10.`,a:`dy/dx = -(2x + ${a}y)/(${a}x + 2y).`}}},
  {id:"tasa_area",ramo:"calculo_diferencial",nivel:3,tema:"Tasa de cambio",make(){let r=rand(2,6),dr=rand(1,3);return {q:`Un círculo aumenta su radio a ${dr} cm/s. ¿A qué tasa aumenta su área cuando r = ${r} cm?`,a:`dA/dt = 2πr·dr/dt = ${2*r*dr}π cm²/s.`}}},
  {id:"extremos",ramo:"calculo_diferencial",nivel:3,tema:"Optimización",make(){let a=rand(2,6),b=rand(8,16);let x=b/(2*a);return {q:`Encuentra el x del máximo de f(x) = -${a}x² + ${b}x + 3.`,a:`Como f'(x) = -${2*a}x + ${b}, el máximo ocurre en x = ${x}.`}}},
  {id:"integral_pot",ramo:"calculo_diferencial",nivel:2,tema:"Integrales",make(){let a=rand(2,8),n=rand(1,4);return {q:`Calcula ∫ ${a}x<sup>${n}</sup> dx.`,a:`${fr(a,n+1)}x<sup>${n+1}</sup> + C.`}}},
  {id:"integral_pol",ramo:"calculo_diferencial",nivel:3,tema:"Integrales",make(){let a=rand(2,6),b=rand(2,8);return {q:`Calcula ∫ (${a}x² ${sign(b)}) dx.`,a:`${fr(a,3)}x³ ${sign(b)}x + C.`}}},
  {id:"integral_def",ramo:"calculo_diferencial",nivel:3,tema:"Integral definida",make(){let b=rand(2,5),a=1;return {q:`Calcula ∫₁^${b} 2x dx.`,a:`[x²]₁^${b} = ${b*b-1}.`}}},
  {id:"area_curvas",ramo:"calculo_diferencial",nivel:4,tema:"Área bajo la curva",make(){let b=rand(2,4);return {q:`Calcula el área bajo y = x² entre x = 0 y x = ${b}.`,a:`∫₀^${b}x²dx = ${fr(b*b*b,3)} unidades².`}}},
  {id:"limite_lineal",ramo:"calculo_diferencial",nivel:1,tema:"Límites",make(){let a=rand(2,8),b=rand(1,9);return {q:`Calcula lim(x→${a}) (${b}x - 2).`,a:`${b*a-2}.`}}},
  {id:"limite_factor",ramo:"calculo_diferencial",nivel:3,tema:"Límites",make(){let a=rand(1,5);return {q:`Calcula lim(x→${a}) (x² - ${a*a})/(x - ${a}).`,a:`Factorizando: x + ${a}; resultado = ${2*a}.`}}},
  {id:"matriz_det2",ramo:"algebra_lineal",nivel:1,tema:"Determinantes",make(){let a=rand(1,6),b=rand(1,5),c=rand(1,5),d=rand(1,6);return {q:`Calcula det [[${a}, ${b}], [${c}, ${d}]].`,a:`det = ${a*d-b*c}.`}}},
  {id:"matriz_suma",ramo:"algebra_lineal",nivel:1,tema:"Matrices",make(){let a=rand(1,5),b=rand(1,5),c=rand(1,5),d=rand(1,5);return {q:`Suma A = [[${a}, ${b}], [${c}, ${d}]] y B = [[1, 2], [3, 1]].`,a:`A + B = [[${a+1}, ${b+2}], [${c+3}, ${d+1}]].`}}},
  {id:"sistema2",ramo:"algebra_lineal",nivel:2,tema:"Sistemas lineales",make(){let x=rand(1,5),y=rand(1,5);return {q:`Resuelve: x + y = ${x+y} y 2x - y = ${2*x-y}.`,a:`x = ${x}, y = ${y}.`}}},
  {id:"inversa2",ramo:"algebra_lineal",nivel:3,tema:"Matrices inversas",make(){let a=2,b=1,c=1,d=1;return {q:`Calcula la inversa de [[2, 1], [1, 1]].`,a:`A⁻¹ = [[1, -1], [-1, 2]].`}}},
  {id:"producto_matriz",ramo:"algebra_lineal",nivel:2,tema:"Producto de matrices",make(){return {q:`Calcula [[1, 2], [3, 1]] · [[2, 1], [1, 2]].`,a:`[[4, 5], [7, 5]].`}}},
  {id:"vector",ramo:"algebra_lineal",nivel:1,tema:"Vectores",make(){let a=rand(1,5),b=rand(1,5);return {q:`Calcula la norma del vector v = (${a}, ${b}) en forma exacta.`,a:`||v|| = √(${a*a+b*b}).`}}},
  {id:"polinomio",ramo:"algebra_basica",nivel:1,tema:"Álgebra",make(){let a=rand(2,8),b=rand(1,8);return {q:`Simplifica: ${a}x + ${b}x - 3x.`,a:`${a+b-3}x.`}}},
  {id:"factor",ramo:"algebra_basica",nivel:2,tema:"Factorización",make(){let a=rand(2,6);return {q:`Factoriza x² + ${2*a}x + ${a*a}.`,a:`(x + ${a})².`}}},
  {id:"cuadratica",ramo:"algebra_basica",nivel:3,tema:"Ecuaciones",make(){let a=rand(2,6);return {q:`Resuelve x² - ${2*a}x + ${a*a-1} = 0.`,a:`x = ${a-1} y x = ${a+1}.`}}},
  {id:"fracciones",ramo:"algebra_basica",nivel:2,tema:"Fracciones algebraicas",make(){return {q:`Simplifica: 3/4 + 5/8.`,a:`11/8.`}}},
];
