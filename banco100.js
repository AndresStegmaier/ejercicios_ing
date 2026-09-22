
"use strict";

/*
  Banco100
  --------
  Garantiza 100 variantes por combinación:
  curso × nivel × subtema.
  No almacena 100 textos repetidos: genera 100 variantes deterministas
  a partir de plantillas, parámetros y estructuras distintas.
*/
window.Banco100 = (() => {
  const TOTAL = 100;

  const state = new Map();

  function key(ramo,nivel,subtema){
    return `${ramo}::${nivel}::${subtema}`;
  }

  function nextIndex(ramo,nivel,subtema){
    const k=key(ramo,nivel,subtema);
    let s=state.get(k);
    if(!s){
      const orden=Array.from({length:TOTAL},(_,i)=>i);
      for(let i=TOTAL-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [orden[i],orden[j]]=[orden[j],orden[i]];
      }
      s={orden,pos:0};
      state.set(k,s);
    }
    if(s.pos>=TOTAL){
      for(let i=TOTAL-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [s.orden[i],s.orden[j]]=[s.orden[j],s.orden[i]];
      }
      s.pos=0;
    }
    return s.orden[s.pos++];
  }

  function fmt(n){
    if(Number.isInteger(n)) return String(n);
    return String(Math.round(n*1000)/1000);
  }

  function nivelNum(nivel){
    return nivel==="aplicados" ? 7 : Math.max(1,Math.min(6,Number(nivel)||1));
  }

  function nombreNivel(nivel){
    const n=nivelNum(nivel);
    return n===7 ? "Aplicados" : `Nivel ${n}`;
  }

  // Selects progressively harder structural families.
  function familiaNivel(seed,nivel,grupos){
    const n=nivelNum(nivel);
    const permitidas=grupos[n] || grupos[6] || grupos[1];
    return permitidas[seed % permitidas.length];
  }

  function envolverAplicado(ramo,subtema,e,seed){
    if(!e) return e;
    e.tema = `${subtema} · Aplicado`;
    const ctx={
      calculo_diferencial:"modelo de ingeniería",
      algebra_lineal:"sistema de producción",
      calculo_basico:"modelo cuantitativo",
      algebra_basica:"situación de costos",
      quimica_general:"proceso químico",
      calculo_multivariable:"modelo de optimización"
    }[ramo] || "situación aplicada";
    e.pregunta = `<b>Contexto:</b> En un ${ctx}, ` + e.pregunta.charAt(0).toLowerCase() + e.pregunta.slice(1);
    e.respuesta += `<br><small>Interpreta el resultado en el contexto del problema.</small>`;
    return e;
  }

  function marcarDificultad(e,nivel){
    if(!e) return e;
    const n=nivelNum(nivel);
    e.dificultad=n;
    e.etiquetaDificultad=n===7?"Aplicados":`Nivel ${n}`;
    return e;
  }


  function signoTermino(coef, variable=""){
    if(coef===0) return "";
    return coef>0 ? `+${coef}${variable}` : `${coef}${variable}`;
  }

  function factorRaiz(r){
    return r>=0 ? `(x-${r})` : `(x+${Math.abs(r)})`;
  }
  function texInline(s){ return "\\(" + String(s) + "\\)"; }
  function texBlock(s){ return "\\(" + String(s) + "\\)"; }

  function p(seed,a,b){
    const w=b-a+1;
    return a + (((seed%w)+w)%w);
  }
  function q(seed,a,b){
    const w=b-a+1;
    return a + ((Math.floor(seed/3)+seed*2+1)%w+w)%w;
  }
  function r(seed,a,b){
    const w=b-a+1;
    return a + ((Math.floor(seed/7)+seed*3+2)%w+w)%w;
  }
  function pick(seed, arr, shift=0){ return arr[(seed+shift)%arr.length]; }

  function calcDiff(seed,nivel,subtema){
    const a=p(seed,2,7), b=q(seed,1,8), c=r(seed,1,6), d=2+(seed%5);
    const lv=nivelNum(nivel);
    let fam=seed%10;

    if(subtema==="Exponenciales"){
      fam=familiaNivel(seed,nivel,{
        1:[0,1], 2:[1,2], 3:[2,3,4], 4:[3,4,5,6], 5:[5,6,7,8], 6:[7,8,9], 7:[4,5,6,7,8,9]
      });
      const gens=[
        ()=>({pregunta:`Deriva ${texInline(`e^{${a}x}`)}.`,respuesta:texInline(`${a}e^{${a}x}`),tema:"Exponenciales · Básica"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{${a}x^2+${b}x}`)}.`,respuesta:texInline(`(${2*a}x+${b})e^{${a}x^2+${b}x}`),tema:"Exponenciales · Cadena"}),
        ()=>({pregunta:`Deriva ${texInline(`x^${d}e^{${a}x}`)}.`,respuesta:texInline(`e^{${a}x}(${d}x^{${d-1}}+${a}x^${d})`),tema:"Exponenciales · Producto"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{\\sin(${a}x)}`)}.`,respuesta:texInline(`${a}\\cos(${a}x)e^{\\sin(${a}x)}`),tema:"Exponenciales · Composición"}),
        ()=>({pregunta:`Deriva ${texInline(`\\frac{e^{${a}x}}{x+${b}}`)}.`,respuesta:texInline(`\\frac{e^{${a}x}(${a}(x+${b})-1)}{(x+${b})^2}`),tema:"Exponenciales · Cociente"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{x^${d}}\\ln(x+${a})`)}.`,respuesta:texInline(`e^{x^${d}}\\left(${d}x^{${d-1}}\\ln(x+${a})+\\frac1{x+${a}}\\right)`),tema:"Exponenciales · Log-exp"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{\\sin(${a}x^2+${b}x)}`)}.`,respuesta:texInline(`(${2*a}x+${b})\\cos(${a}x^2+${b}x)e^{\\sin(${a}x^2+${b}x)}`),tema:"Exponenciales · Composición múltiple"}),
        ()=>({pregunta:`Deriva ${texInline(`\\frac{x^${d}e^{${a}x^2}}{\\ln(x+${b})}`)}.`,respuesta:texInline(`f'(x)=f(x)\\left(\\frac{${d}}x+${2*a}x-\\frac1{(x+${b})\\ln(x+${b})}\\right)`),tema:"Exponenciales · Avanzada"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{e^{${a}x^2+${b}x}}`)}.`,respuesta:texInline(`(${2*a}x+${b})e^{${a}x^2+${b}x}e^{e^{${a}x^2+${b}x}}`),tema:"Exponenciales · Exponencial anidada"}),
        ()=>({pregunta:`Deriva y simplifica ${texInline(`\\frac{x^${d}e^{\\sin(${a}x^2+${b}x)}}{\\ln(x+${c})\\sqrt{x^2+1}}`)}.`,respuesta:texInline(`f'(x)=f(x)\\left(\\frac{${d}}x+(${2*a}x+${b})\\cos(${a}x^2+${b}x)-\\frac1{(x+${c})\\ln(x+${c})}-\\frac{x}{x^2+1}\\right)`),tema:"Exponenciales · EXTREMO"})
      ];
      return gens[fam]();
    }

    if(subtema==="Regla de la cadena"){
      fam=familiaNivel(seed,nivel,{
        1:[0,3,5],
        2:[0,1,2,3,5],
        3:[0,1,2,3,4,5],
        4:[1,2,4,6,8],
        5:[4,6,7,8,9],
        6:[6,7,8,9],
        7:[6,7,8,9]
      });
      const gens=[
        ()=>({pregunta:`Deriva ${texInline(`(${a}x^2+${b}x+${c})^{${d}}`)}`,respuesta:texBlock(`${d}(${a}x^2+${b}x+${c})^{${d-1}}(${2*a}x+${b})`),tema:"Regla de la cadena · Potencia"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{${a}x^2+${b}x}`)}`,respuesta:texBlock(`(${2*a}x+${b})e^{${a}x^2+${b}x}`),tema:"Regla de la cadena · Exponencial"}),
        ()=>({pregunta:`Deriva ${texInline(`\\ln(${a}x^3+${b}x+${c})`)}`,respuesta:texBlock(`\\frac{${3*a}x^2+${b}}{${a}x^3+${b}x+${c}}`),tema:"Regla de la cadena · Logaritmo"}),
        ()=>({pregunta:`Deriva ${texInline(`\\sin(${a}x^2+${b}x+${c})`)}`,respuesta:texBlock(`(${2*a}x+${b})\\cos(${a}x^2+${b}x+${c})`),tema:"Regla de la cadena · Trigonométrica"}),
        ()=>({pregunta:`Deriva ${texInline(`\\cos^{${d}}(${a}x+${b})`)}`,respuesta:texBlock(`-${a*d}\\cos^{${d-1}}(${a}x+${b})\\sin(${a}x+${b})`),tema:"Regla de la cadena · Potencia trigonométrica"}),
        ()=>({pregunta:`Deriva ${texInline(`\\sqrt{${a}x^3+${b}x^2+${c}}`)}`,respuesta:texBlock(`\\frac{${3*a}x^2+${2*b}x}{2\\sqrt{${a}x^3+${b}x^2+${c}}}`),tema:"Regla de la cadena · Radical"}),
        ()=>({pregunta:`Deriva ${texInline(`e^{\\sin(${a}x+${b})}`)}`,respuesta:texBlock(`${a}\\cos(${a}x+${b})e^{\\sin(${a}x+${b})}`),tema:"Regla de la cadena · Composición doble"}),
        ()=>({pregunta:`Deriva ${texInline(`\\ln(1+e^{${a}x+${b}})`)}`,respuesta:texBlock(`\\frac{${a}e^{${a}x+${b}}}{1+e^{${a}x+${b}}}`),tema:"Regla de la cadena · Log-exp"}),
        ()=>({pregunta:`Deriva ${texInline(`\\tan(${a}x^2+${b})`)}`,respuesta:texBlock(`${2*a}x\\sec^2(${a}x^2+${b})`),tema:"Regla de la cadena · Tangente"}),
        ()=>({pregunta:`Deriva ${texInline(`\\left(${a}+\\sin(${b}x)\\right)^{${d}}`)}`,respuesta:texBlock(`${b*d}\\left(${a}+\\sin(${b}x)\\right)^{${d-1}}\\cos(${b}x)`),tema:"Regla de la cadena · Compuesta"})
      ];
      return gens[fam]();
    }

    if(subtema==="Derivación implícita"){
      fam=familiaNivel(seed,nivel,{
        1:[0],
        2:[0,1],
        3:[1,2,5],
        4:[2,3,5],
        5:[3,4,6,7],
        6:[4,6,7,8,9],
        7:[4,6,7,8,9]
      });
      const gens=[
        ()=>({pregunta:`Si ${texInline(`x^2+${a}xy+y^2=${b+c+8}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=-\\frac{2x+${a}y}{${a}x+2y}`),tema:"Derivación implícita · Cuadrática"}),
        ()=>({pregunta:`Si ${texInline(`x^3+y^3=${a}xy`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=\\frac{${a}y-3x^2}{3y^2-${a}x}`),tema:"Derivación implícita · Cúbica"}),
        ()=>({pregunta:`Si ${texInline(`x^2y+${a}xy^2=${b}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=-\\frac{2xy+${a}y^2}{x^2+${2*a}xy}`),tema:"Derivación implícita · Producto"}),
        ()=>({pregunta:`Si ${texInline(`e^x+e^y=${a}xy`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=\\frac{${a}y-e^x}{e^y-${a}x}`),tema:"Derivación implícita · Exponencial"}),
        ()=>({pregunta:`Si ${texInline(`\\sin(xy)+${a}x^2-y=${b}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=-\\frac{y\\cos(xy)+${2*a}x}{x\\cos(xy)-1}`),tema:"Derivación implícita · Trigonométrica"}),
        ()=>({pregunta:`Si ${texInline(`\\ln(x+y)+${a}xy=${b}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=-\\frac{\\frac1{x+y}+${a}y}{\\frac1{x+y}+${a}x}`),tema:"Derivación implícita · Logarítmica"}),
        ()=>({pregunta:`Si ${texInline(`xe^y+${a}ye^x=${b+c}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=-\\frac{e^y+${a}ye^x}{xe^y+${a}e^x}`),tema:"Derivación implícita · Euler"}),
        ()=>({pregunta:`Si ${texInline(`x\\sin y+${a}y\\cos x=${b}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=\\frac{${a}y\\sin x-\\sin y}{x\\cos y+${a}\\cos x}`),tema:"Derivación implícita · Trigonométrica avanzada"}),
        ()=>({pregunta:`Si ${texInline(`x^2+${a}xy+${b}y^2=e^{x+y}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=\\frac{e^{x+y}-2x-${a}y}{${a}x+${2*b}y-e^{x+y}}`),tema:"Derivación implícita · Mixta"}),
        ()=>({pregunta:`Si ${texInline(`\\cos(x+y)+${a}x^2y=${b}`)}, calcula ${texInline("y'")}.`,respuesta:texBlock(`y'=\\frac{\\sin(x+y)-${2*a}xy}{${a}x^2-\\sin(x+y)}`),tema:"Derivación implícita · Mixta trigonométrica"})
      ];
      return gens[fam]();
    }

    if(subtema==="Derivadas"){
      fam=familiaNivel(seed,nivel,{
        1:[0,4,5],
        2:[0,3,4,5],
        3:[1,2,3,4],
        4:[1,2,6,7],
        5:[6,7,8,9],
        6:[7,8,9],
        7:[6,7,8,9]
      });
      const gens=[
        ()=>({pregunta:`Deriva ${texInline(`${a}x^${d}+${b}x^2-${c}x`)}`,respuesta:texBlock(`${a*d}x^${d-1}+${2*b}x-${c}`),tema:"Derivadas · Polinómica"}),
        ()=>({pregunta:`Deriva ${texInline(`x^${d}e^{${a}x}`)}`,respuesta:texBlock(`${d}x^${d-1}e^{${a}x}+${a}x^${d}e^{${a}x}`),tema:"Derivadas · Producto"}),
        ()=>({pregunta:`Deriva ${texInline(`\\frac{x^2+${a}}{x+${b}}`)}`,respuesta:texBlock(`\\frac{2x(x+${b})-(x^2+${a})}{(x+${b})^2}`),tema:"Derivadas · Cociente"}),
        ()=>({pregunta:`Deriva ${texInline(`\\ln x+${a}e^x`)}`,respuesta:texBlock(`\\frac1x+${a}e^x`),tema:"Derivadas · Log-exp"}),
        ()=>({pregunta:`Deriva ${texInline(`${a}\\sin x-${b}\\cos x`)}`,respuesta:texBlock(`${a}\\cos x+${b}\\sin x`),tema:"Derivadas · Trigonométrica"}),
        ()=>({pregunta:`Deriva ${texInline(`\\sqrt{x}+\\frac{${a}}{x}`)}`,respuesta:texBlock(`\\frac1{2\\sqrt{x}}-\\frac{${a}}{x^2}`),tema:"Derivadas · Radical y racional"}),
        ()=>({pregunta:`Deriva ${texInline(`${a}x^${d}\\ln x`)}`,respuesta:texBlock(`${a*d}x^${d-1}\\ln x+${a}x^${d-1}`),tema:"Derivadas · Producto logarítmico"}),
        ()=>({pregunta:`Deriva ${texInline(`\\frac{e^x}{x+${a}}`)}`,respuesta:texBlock(`\\frac{e^x(x+${a}-1)}{(x+${a})^2}`),tema:"Derivadas · Exponencial racional"}),
        ()=>({pregunta:`Deriva ${texInline(`\\arctan(${a}x)`)}`,respuesta:texBlock(`\\frac{${a}}{1+${a*a}x^2}`),tema:"Derivadas · Inversa trigonométrica"}),
        ()=>({pregunta:`Deriva ${texInline(`${a}x^x`)}`,respuesta:texBlock(`${a}x^x(\\ln x+1)`),tema:"Derivadas · Logarítmica"})
      ];
      return gens[fam]();
    }

    if(subtema==="Tasas de cambio"){
      fam=familiaNivel(seed,nivel,{
        1:[0,2],
        2:[0,2,3],
        3:[1,3,5],
        4:[1,4,5,6],
        5:[4,7,8,9],
        6:[4,7,8,9],
        7:[0,1,4,5,7,8,9]
      });
      const R=a+2, dr=b;
      const gens=[
        ()=>({pregunta:`El radio de un círculo crece a ${dr} cm/s. Halla dA/dt cuando r=${R} cm.`,respuesta:texBlock(`\\frac{dA}{dt}=2\\pi r\\frac{dr}{dt}=${2*R*dr}\\pi`),tema:"Tasas de cambio · Área"}),
        ()=>({pregunta:`El radio de una esfera crece a ${dr} cm/s. Halla dV/dt cuando r=${R} cm.`,respuesta:texBlock(`\\frac{dV}{dt}=4\\pi r^2\\frac{dr}{dt}=${4*R*R*dr}\\pi`),tema:"Tasas de cambio · Esfera"}),
        ()=>({pregunta:`Un lado de un cuadrado crece a ${dr} cm/s. Halla dA/dt cuando el lado mide ${R} cm.`,respuesta:texBlock(`${2*R*dr}\\;cm^2/s`),tema:"Tasas de cambio · Cuadrado"}),
        ()=>({pregunta:`La arista de un cubo crece a ${dr} cm/s. Halla dV/dt cuando mide ${R} cm.`,respuesta:texBlock(`${3*R*R*dr}\\;cm^3/s`),tema:"Tasas de cambio · Cubo"}),
        ()=>({pregunta:`Una escalera de ${R+5} m se apoya en un muro. La base se aleja a ${dr} m/s. Plantea la razón vertical dy/dt en términos de x,y.`,respuesta:texBlock(`\\frac{dy}{dt}=-\\frac{x}{y}${dr}`),tema:"Tasas de cambio · Escalera"}),
        ()=>({pregunta:`El radio de un cilindro permanece fijo en ${R} cm y la altura aumenta a ${dr} cm/s. Halla dV/dt.`,respuesta:texBlock(`${R*R*dr}\\pi`),tema:"Tasas de cambio · Cilindro"}),
        ()=>({pregunta:`La temperatura T de un cuerpo satisface T=${a}t^2+${b}t+${c}. Halla dT/dt en t=${d}.`,respuesta:texBlock(`${2*a*d+b}`),tema:"Tasas de cambio · Temporal"}),
        ()=>({pregunta:`El área A de un círculo aumenta a ${a}π cm²/s. Halla dr/dt cuando r=${R}.`,respuesta:texBlock(`\\frac{${a}}{${2*R}}`),tema:"Tasas de cambio · Inversa"}),
        ()=>({pregunta:`Una sombra cumple xy=${a*20}. Si x aumenta a ${dr}, expresa dy/dt.`,respuesta:texBlock(`\\frac{dy}{dt}=-\\frac{y}{x}${dr}`),tema:"Tasas de cambio · Producto"}),
        ()=>({pregunta:`El volumen de un cono V=\\frac13\\pi r^2h y r=h/${a}. Deriva V respecto del tiempo en función de h y dh/dt.`,respuesta:texBlock(`\\frac{dV}{dt}=\\frac{\\pi h^2}{${a*a}}\\frac{dh}{dt}`),tema:"Tasas de cambio · Cono"})
      ];
      return gens[fam]();
    }

    if(subtema==="Integrales indefinidas"){
      fam=familiaNivel(seed,nivel,{
        1:[0,4,8,9],
        2:[0,1,4,8,9],
        3:[1,2,3,4,5],
        4:[1,2,3,5,7],
        5:[5,6,7],
        6:[6,7],
        7:[1,2,3,5,6,7]
      });
      const gens=[
        ()=>({pregunta:`Calcula ${texBlock(`\\int (${a}x^${d}+${b}x-${c})\\,dx`)}`,respuesta:texBlock(`\\frac{${a}}{${d+1}}x^${d+1}+\\frac{${b}}2x^2-${c}x+C`),tema:"Integrales indefinidas · Polinómica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int e^{${a}x}\\,dx`)}`,respuesta:texBlock(`\\frac1{${a}}e^{${a}x}+C`),tema:"Integrales indefinidas · Exponencial"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\cos(${a}x)\\,dx`)}`,respuesta:texBlock(`\\frac1{${a}}\\sin(${a}x)+C`),tema:"Integrales indefinidas · Trigonométrica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\frac{${a}}{x}\\,dx`)}`,respuesta:texBlock(`${a}\\ln|x|+C`),tema:"Integrales indefinidas · Logarítmica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}x^{${d}}\\,dx`)}`,respuesta:texBlock(`\\frac{${a}}{${d+1}}x^{${d+1}}+C`),tema:"Integrales indefinidas · Potencia"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\sec^2(${a}x)\\,dx`)}`,respuesta:texBlock(`\\frac1{${a}}\\tan(${a}x)+C`),tema:"Integrales indefinidas · Secante"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\frac{${a}}{1+x^2}\\,dx`)}`,respuesta:texBlock(`${a}\\arctan x+C`),tema:"Integrales indefinidas · Inversa trigonométrica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int (${a}e^x+${b}\\sin x)\\,dx`)}`,respuesta:texBlock(`${a}e^x-${b}\\cos x+C`),tema:"Integrales indefinidas · Mixta"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\frac{${a}}{\\sqrt{x}}\\,dx`)}`,respuesta:texBlock(`${2*a}\\sqrt{x}+C`),tema:"Integrales indefinidas · Radical"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int (${a}+${b}x^{-2})\\,dx`)}`,respuesta:texBlock(`${a}x-${b}x^{-1}+C`),tema:"Integrales indefinidas · Potencias negativas"})
      ];
      return gens[fam]();
    }

    if(subtema==="Integrales definidas"){
      fam=familiaNivel(seed,nivel,{
        1:[0,1,6,7],
        2:[0,1,6,7],
        3:[2,3,6,7],
        4:[2,3,4,5],
        5:[4,5,8,9],
        6:[4,5,8,9],
        7:[0,1,2,3,4,5,6,7,8,9]
      });
      const L=seed%4, U=L+2+(seed%5);
      const gens=[
        ()=>({pregunta:`Calcula ${texBlock(`\\int_${L}^${U} ${a}x\\,dx`)}`,respuesta:texBlock(`${fmt(a*(U*U-L*L)/2)}`),tema:"Integrales definidas · Lineal"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_${L}^${U} ${a}x^2\\,dx`)}`,respuesta:texBlock(`${fmt(a*(U**3-L**3)/3)}`),tema:"Integrales definidas · Cuadrática"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_0^{\\pi} ${a}\\sin x\\,dx`)}`,respuesta:texBlock(`${2*a}`),tema:"Integrales definidas · Seno"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_0^{\\pi/2} ${a}\\cos x\\,dx`)}`,respuesta:texBlock(`${a}`),tema:"Integrales definidas · Coseno"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_1^{${U+1}} \\frac{${a}}x\\,dx`)}`,respuesta:texBlock(`${a}\\ln(${U+1})`),tema:"Integrales definidas · Logarítmica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_0^1 ${a}e^x\\,dx`)}`,respuesta:texBlock(`${a}(e-1)`),tema:"Integrales definidas · Exponencial"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_${L}^${U} (${a}x+${b})\\,dx`)}`,respuesta:texBlock(`${fmt(a*(U*U-L*L)/2+b*(U-L))}`),tema:"Integrales definidas · Afín"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_0^1 ${a}x^${d}\\,dx`)}`,respuesta:texBlock(`\\frac{${a}}{${d+1}}`),tema:"Integrales definidas · Potencia"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_{-${a}}^{${a}} x^3\\,dx`)}`,respuesta:texBlock(`0`),tema:"Integrales definidas · Simetría"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int_{-${a}}^{${a}} x^2\\,dx`)}`,respuesta:texBlock(`\\frac{${2*a**3}}3`),tema:"Integrales definidas · Función par"})
      ];
      return gens[fam]();
    }

    if(subtema==="Sustitución"){
      fam=familiaNivel(seed,nivel,{
        1:[1,2,8],
        2:[0,1,2,8],
        3:[0,3,4,8],
        4:[4,5,6,7],
        5:[5,6,7,9],
        6:[6,7,9],
        7:[0,4,5,6,7,9]
      });
      const gens=[
        ()=>({pregunta:`Calcula ${texBlock(`\\int 2x(${a}+x^2)^${d}\\,dx`)}`,respuesta:texBlock(`\\frac{(${a}+x^2)^${d+1}}{${d+1}}+C`),tema:"Sustitución · Potencia"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}e^{${a}x+${b}}\\,dx`)}`,respuesta:texBlock(`e^{${a}x+${b}}+C`),tema:"Sustitución · Exponencial"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}\\cos(${a}x+${b})\\,dx`)}`,respuesta:texBlock(`\\sin(${a}x+${b})+C`),tema:"Sustitución · Trigonométrica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\frac{${a}}{${a}x+${b}}\\,dx`)}`,respuesta:texBlock(`\\ln|${a}x+${b}|+C`),tema:"Sustitución · Logarítmica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int x e^{x^2+${a}}\\,dx`)}`,respuesta:texBlock(`\\frac12e^{x^2+${a}}+C`),tema:"Sustitución · x²"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\frac{x}{\\sqrt{x^2+${a}}}\\,dx`)}`,respuesta:texBlock(`\\sqrt{x^2+${a}}+C`),tema:"Sustitución · Radical"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\sin(${a}x)\\cos(${a}x)\\,dx`)}`,respuesta:texBlock(`\\frac1{${2*a}}\\sin^2(${a}x)+C`),tema:"Sustitución · Producto trigonométrico"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int \\frac{${2*a}x}{${a}x^2+${b}}\\,dx`)}`,respuesta:texBlock(`\\ln|${a}x^2+${b}|+C`),tema:"Sustitución · Racional"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int (${a}x+${b})^${d}\\,dx`)}`,respuesta:texBlock(`\\frac{(${a}x+${b})^${d+1}}{${a*(d+1)}}+C`),tema:"Sustitución · Lineal"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int e^{${a}x}\\sin(e^{${a}x})\\,dx`)}`,respuesta:texBlock(`-\\frac1{${a}}\\cos(e^{${a}x})+C`),tema:"Sustitución · Compuesta"})
      ];
      return gens[fam]();
    }

    if(subtema==="Integración por partes"){
      fam=familiaNivel(seed,nivel,{
        1:[4],
        2:[0,1,2,4],
        3:[0,1,2,3],
        4:[3,5,8,9],
        5:[5,6,8,9],
        6:[6,7,8],
        7:[0,1,2,3,5,6,7,8,9]
      });
      const gens=[
        ()=>({pregunta:`Calcula ${texBlock(`\\int x e^{${a}x}\\,dx`)}`,respuesta:texBlock(`e^{${a}x}\\left(\\frac{x}{${a}}-\\frac1{${a*a}}\\right)+C`),tema:"Integración por partes · x·exp"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int x\\cos(${a}x)\\,dx`)}`,respuesta:texBlock(`\\frac{x\\sin(${a}x)}{${a}}+\\frac{\\cos(${a}x)}{${a*a}}+C`),tema:"Integración por partes · x·cos"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int x\\sin(${a}x)\\,dx`)}`,respuesta:texBlock(`-\\frac{x\\cos(${a}x)}{${a}}+\\frac{\\sin(${a}x)}{${a*a}}+C`),tema:"Integración por partes · x·sin"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}x\\ln x\\,dx`)}`,respuesta:texBlock(`${a}\\left(\\frac{x^2}{2}\\ln x-\\frac{x^2}{4}\\right)+C`),tema:"Integración por partes · xlnx"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}\\ln x\\,dx`)}`,respuesta:texBlock(`${a}x\\ln x-${a}x+C`),tema:"Integración por partes · lnx"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}x^2e^x\\,dx`)}`,respuesta:texBlock(`${a}e^x(x^2-2x+2)+C`),tema:"Integración por partes · repetida"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}x\\arctan x\\,dx`)}`,respuesta:texBlock(`${a}\\left(\\frac{x^2+1}{2}\\arctan x-\\frac{x}{2}\\right)+C`),tema:"Integración por partes · arctan"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}e^x\\cos x\\,dx`)}`,respuesta:texBlock(`${a}\\frac{e^x}{2}(\\sin x+\\cos x)+C`),tema:"Integración por partes · cíclica"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int ${a}x^${d}\\ln x\\,dx`)}`,respuesta:texBlock(`${a}\\left(\\frac{x^${d+1}}{${d+1}}\\ln x-\\frac{x^${d+1}}{${(d+1)**2}}\\right)+C`),tema:"Integración por partes · potencia-log"}),
        ()=>({pregunta:`Calcula ${texBlock(`\\int (${a}x+${b})e^x\\,dx`)}`,respuesta:texBlock(`e^x(${a}x+${b-a})+C`),tema:"Integración por partes · lineal-exp"})
      ];
      return gens[fam]();
    }

    return {pregunta:`Ejercicio ${seed+1} de ${subtema}.`,respuesta:"Revisa el procedimiento del subtema.",tema:subtema};
  }

  function algebraLineal(seed,nivel,subtema){
    const lv=nivelNum(nivel);
    const a=p(seed,1,6),b=q(seed,1,7),c=r(seed,1,5),d=p(seed+12,1,7);
    let fam=seed%10;
    if(subtema==="Matrices y operaciones"){
      fam=familiaNivel(seed,nivel,{
        1:[0,1,2,3,5,6],
        2:[0,1,2,3,6,8],
        3:[4,7,9],
        4:[4,7,9],
        5:[4,7,9],
        6:[4,7,9],
        7:[4,7,9]
      });
      const A=`\\begin{pmatrix}${a}&${b}\\\\${c}&${d}\\end{pmatrix}`;
      const B=`\\begin{pmatrix}${b}&${c}\\\\${d}&${a}\\end{pmatrix}`;
      const gens=[
        ()=>({pregunta:`Calcula ${texInline(`A+B`)}, con ${texInline(`A=${A},\\ B=${B}`)}.`,respuesta:texBlock(`\\begin{pmatrix}${a+b}&${b+c}\\\\${c+d}&${d+a}\\end{pmatrix}`),tema:"Matrices y operaciones · Suma"}),
        ()=>({pregunta:`Calcula ${texInline(`${a}A`)}, con ${texInline(`A=${B}`)}.`,respuesta:texBlock(`\\begin{pmatrix}${a*b}&${a*c}\\\\${a*d}&${a*a}\\end{pmatrix}`),tema:"Matrices y operaciones · Escalar"}),
        ()=>({pregunta:`Calcula la traza de ${texInline(A)}.`,respuesta:texBlock(`${a+d}`),tema:"Matrices y operaciones · Traza"}),
        ()=>({pregunta:`Transpone ${texInline(A)}.`,respuesta:texBlock(`\\begin{pmatrix}${a}&${c}\\\\${b}&${d}\\end{pmatrix}`),tema:"Matrices y operaciones · Transpuesta"}),
        ()=>({pregunta:`Calcula ${texInline(`AB`)}, con ${texInline(`A=${A},\\ B=${B}`)}.`,respuesta:texBlock(`\\begin{pmatrix}${a*b+b*d}&${a*c+b*a}\\\\${c*b+d*d}&${c*c+d*a}\\end{pmatrix}`),tema:"Matrices y operaciones · Producto"}),
        ()=>({pregunta:`¿Cuál es el orden de ${texInline(`\\begin{pmatrix}${a}&${b}&${c}\\\\${d}&${a}&${b}\\end{pmatrix}`)}?`,respuesta:"2×3",tema:"Matrices y operaciones · Orden"}),
        ()=>({pregunta:`Calcula ${texInline(`A-B`)}, con ${texInline(`A=${A},\\ B=${B}`)}.`,respuesta:texBlock(`\\begin{pmatrix}${a-b}&${b-c}\\\\${c-d}&${d-a}\\end{pmatrix}`),tema:"Matrices y operaciones · Resta"}),
        ()=>({pregunta:`Si ${texInline(`A=${A}`)}, calcula ${texInline(`A^2`)}.`,respuesta:texBlock(`\\begin{pmatrix}${a*a+b*c}&${a*b+b*d}\\\\${c*a+d*c}&${c*b+d*d}\\end{pmatrix}`),tema:"Matrices y operaciones · Potencia"}),
        ()=>({pregunta:`Calcula la suma de todos los elementos de ${texInline(A)}.`,respuesta:texBlock(`${a+b+c+d}`),tema:"Matrices y operaciones · Elementos"}),
        ()=>({pregunta:`Si ${texInline(`A=${A}`)}, calcula ${texInline(`2A-I`)}.`,respuesta:texBlock(`\\begin{pmatrix}${2*a-1}&${2*b}\\\\${2*c}&${2*d-1}\\end{pmatrix}`),tema:"Matrices y operaciones · Combinación"})
      ]; return gens[fam]();
    }
    if(subtema==="Determinantes"){
      let dd=d; if(a*dd-b*c===0) dd++;
      const det=a*dd-b*c;
      if(lv<=2) return {pregunta:`Calcula ${texInline(`\\det\\begin{pmatrix}${a}&${b}\\\\${c}&${dd}\\end{pmatrix}`)}.`,respuesta:texBlock(`${det}`),tema:"Determinantes · 2×2"};
      if(lv<=4) return {pregunta:`Calcula por cofactores ${texInline(`\\det\\begin{pmatrix}${a}&${b}&0\\\\${c}&${dd}&1\\\\0&${a}&${b}\\end{pmatrix}`)}.`,respuesta:texBlock(`${a*(dd*b-a)-b*(c*b)}`),tema:"Determinantes · 3×3"};
      return {pregunta:`Sea ${texInline(`A=\\begin{pmatrix}${a}&${b}&0\\\\${c}&${dd}&1\\\\0&${a}&${b}\\end{pmatrix}`)}. Calcula det(A) y decide si A es invertible.`,respuesta:`${texInline(`\\det(A)=${a*(dd*b-a)-b*(c*b)}`)}. Es invertible si ese valor es distinto de 0.`,tema:"Determinantes · análisis"};
    }
    if(subtema==="Inversas"){
      let dd=d; if(a*dd-b*c===0) dd++;
      const det=a*dd-b*c;
      if(lv<=3) return {pregunta:`Halla la inversa de ${texInline(`\\begin{pmatrix}${a}&${b}\\\\${c}&${dd}\\end{pmatrix}`)}.`,respuesta:texBlock(`\\frac1{${det}}\\begin{pmatrix}${dd}&-${b}\\\\-${c}&${a}\\end{pmatrix}`),tema:"Inversas · 2×2"};
      return {pregunta:`Para ${texInline(`A=\\begin{pmatrix}${a}&${b}\\\\${c}&${dd}\\end{pmatrix}`)}, halla A⁻¹ y verifica multiplicando A·A⁻¹.`,respuesta:`${texBlock(`A^{-1}=\\frac1{${det}}\\begin{pmatrix}${dd}&-${b}\\\\-${c}&${a}\\end{pmatrix}`)} La verificación debe dar I.`,tema:"Inversas · verificación"};
    }
    if(subtema==="Sistemas lineales"){
      const x=(seed%9)-4,y=((seed*3)%9)-4;
      return {pregunta:`Resuelve ${texInline(`\\begin{cases}${a}x+${b}y=${a*x+b*y}\\\\${c}x+${d}y=${c*x+d*y}\\end{cases}`)}.`,respuesta:texBlock(`x=${x},\\ y=${y}`),tema:"Sistemas lineales · 2×2"};
    }
    if(subtema==="Vectores y espacios"){
      const gens=[
        ()=>({pregunta:`Calcula ${texInline(`(${a},${b},${c})\\cdot(${d},${c},${b})`)}.`,respuesta:texBlock(`${a*d+b*c+c*b}`),tema:"Vectores y espacios · Producto punto"}),
        ()=>({pregunta:`Norma de ${texInline(`(${a},${b})`)}.`,respuesta:texBlock(`\\sqrt{${a*a+b*b}}`),tema:"Vectores y espacios · Norma"}),
        ()=>({pregunta:`¿Son ortogonales ${texInline(`(${a},${b})`)} y ${texInline(`(${b},-${a})`)}?`,respuesta:"Sí, su producto punto es 0.",tema:"Vectores y espacios · Ortogonalidad"}),
        ()=>({pregunta:`Escribe un vector perpendicular a ${texInline(`(${a},${b})`)}.`,respuesta:texInline(`(${b},-${a})`),tema:"Vectores y espacios · Perpendicular"}),
        ()=>({pregunta:`¿Pertenecen ${texInline(`(${a},${b})`)} y ${texInline(`(${2*a},${2*b})`)} a la misma recta vectorial?`,respuesta:"Sí, el segundo es múltiplo del primero.",tema:"Vectores y espacios · Dependencia"}),
        ()=>({pregunta:`Calcula ${texInline(`(${a},${b})+(${c},${d})`)}.`,respuesta:texInline(`(${a+c},${b+d})`),tema:"Vectores y espacios · Suma"}),
        ()=>({pregunta:`Calcula ${texInline(`${c}(${a},${b})`)}.`,respuesta:texInline(`(${a*c},${b*c})`),tema:"Vectores y espacios · Escalar"}),
        ()=>({pregunta:`Distancia entre ${texInline(`(${a},${b})`)} y ${texInline(`(${c},${d})`)}.`,respuesta:texBlock(`\\sqrt{${(a-c)**2+(b-d)**2}}`),tema:"Vectores y espacios · Distancia"}),
        ()=>({pregunta:`Proyección escalar de ${texInline(`(${a},${b})`)} sobre ${texInline(`(1,0)`)}.`,respuesta:texBlock(`${a}`),tema:"Vectores y espacios · Proyección"}),
        ()=>({pregunta:`¿Cuál es la dimensión de ${texInline(`\\mathbb R^${a+2}`)}?`,respuesta:String(a+2),tema:"Vectores y espacios · Dimensión"})
      ]; return gens[fam]();
    }
    if(subtema==="Valores propios"){
      const l1=a,l2=d+7;
      return {pregunta:`Halla los valores propios de ${texInline(`\\begin{pmatrix}${l1}&${b}\\\\0&${l2}\\end{pmatrix}`)}.`,respuesta:texBlock(`\\lambda_1=${l1},\\ \\lambda_2=${l2}`),tema:"Valores propios · Triangular"};
    }
    if(subtema==="Diagonalización"){
      const l1=a+5,l2=a;
      return {pregunta:`Diagonaliza ${texInline(`A=\\begin{pmatrix}${l1}&${b}\\\\0&${l2}\\end{pmatrix}`)} si es posible.`,respuesta:`Como los valores propios ${l1} y ${l2} son distintos, A es diagonalizable. Una matriz D válida es ${texInline(`\\operatorname{diag}(${l1},${l2})`)}.`,tema:"Diagonalización · 2×2"};
    }
    return null;
  }

  function basico(seed,nivel,subtema,ramo){
    const lv=nivelNum(nivel);
    const a=p(seed,2,8),b=q(seed,1,9),c=r(seed,1,7),d=2+(seed%5);
    let fam=seed%10;
    if(subtema==="Ecuaciones"){
      const x1=(seed%9)-4,x2=((seed*3)%11)-5;
      if(lv===1) return {pregunta:`Resuelve ${texInline(`${a}x=${a*x1}`)}.`,respuesta:texInline(`x=${x1}`),tema:"Ecuaciones · Lineal"};
      if(lv===2) return {pregunta:`Resuelve ${texInline(`${a}x+${b}=${a*x1+b}`)}.`,respuesta:texInline(`x=${x1}`),tema:"Ecuaciones · Lineal"};
      if(lv<=4){
        const B=-a*(x1+x2), C=a*x1*x2;
        return {pregunta:`Resuelve ${texInline(`${a}x^2${signoTermino(B,"x")}${signoTermino(C)}=0`)}.`,respuesta:texBlock(`x=${x1},\\ ${x2}`),tema:"Ecuaciones · Cuadrática"};
      }
      return {pregunta:`Resuelve y verifica ${texInline(`${factorRaiz(x1)}${factorRaiz(x2)}${factorRaiz(c)}=0`)}.`,respuesta:texBlock(`x=${x1},\\ ${x2},\\ ${c}`),tema:"Ecuaciones · Polinómica"};
    }
    if(subtema==="Potencias y radicales"){
      fam=familiaNivel(seed,nivel,{
        1:[0,1,4,9],2:[0,1,2,4,9],3:[2,5,6,9],4:[3,5,6,7],5:[3,7,8],6:[3,7,8],7:[3,5,7,8]
      });
      const gens=[
        ()=>({pregunta:`Simplifica ${texInline(`\\sqrt{${a*a}x^2}`)} suponiendo x≥0.`,respuesta:texInline(`${a}x`),tema:"Potencias y radicales · Raíz"}),
        ()=>({pregunta:`Simplifica ${texInline(`x^${a}x^${b}`)}.`,respuesta:texInline(`x^${a+b}`),tema:"Potencias y radicales · Potencias"}),
        ()=>({pregunta:`Simplifica ${texInline(`\\frac{x^${a}}{x^${b}}`)}.`,respuesta:texInline(`x^${a-b}`),tema:"Potencias y radicales · Cociente"}),
        ()=>({pregunta:`Racionaliza ${texInline(`\\frac1{\\sqrt{${a}}}`)}.`,respuesta:texInline(`\\frac{\\sqrt{${a}}}{${a}}`),tema:"Potencias y radicales · Racionalización"}),
        ()=>({pregunta:`Calcula ${texInline(`(${a}^2)^{${d}}`)}.`,respuesta:String((a*a)**d),tema:"Potencias y radicales · Potencia de potencia"}),
        ()=>({pregunta:`Simplifica ${texInline(`\\sqrt{${a*a*b}}`)}.`,respuesta:texInline(`${a}\\sqrt{${b}`+"}"),tema:"Potencias y radicales · Simplificación"}),
        ()=>({pregunta:`Simplifica ${texInline(`${a}\\sqrt[${d}]{x^${d}}`)} suponiendo x≥0.`,respuesta:texInline(`${a}x`),tema:"Potencias y radicales · Índices"}),
        ()=>({pregunta:`Simplifica ${texInline(`x^{${a}/${b}}x^{${c}/${b}}`)}.`,respuesta:texInline(`x^{${a+c}/${b}}`),tema:"Potencias y radicales · Exponentes racionales"}),
        ()=>({pregunta:`Resuelve ${texInline(`\\sqrt{x+${a}}=${b}`)}.`,respuesta:texInline(`x=${b*b-a}`),tema:"Potencias y radicales · Ecuación radical"}),
        ()=>({pregunta:`Simplifica ${texInline(`(${a}x^${b})(${c}x^${d})`)}.`,respuesta:texInline(`${a*c}x^${b+d}`),tema:"Potencias y radicales · Producto"})
      ]; return gens[fam]();
    }
    if(subtema==="Exponenciales y logaritmos"){
      fam=familiaNivel(seed,nivel,{
        1:[0,6],2:[0,6,7],3:[1,2,6,7],4:[1,2,3,4,5],5:[3,4,5,8,9],6:[3,4,5,8,9],7:[2,3,4,5,8,9]
      });
      const gens=[
        ()=>({pregunta:`Resuelve ${texInline(`${a}^x=${a}^${d}`)}.`,respuesta:texInline(`x=${d}`),tema:"Exponenciales y logaritmos · Exponencial"}),
        ()=>({pregunta:`Simplifica ${texInline(`\\log(${a}x)-\\log x`)}.`,respuesta:texInline(`\\log ${a}`),tema:"Exponenciales y logaritmos · Propiedades"}),
        ()=>({pregunta:`Resuelve ${texInline(`\\ln x=${b}`)}.`,respuesta:texInline(`x=e^${b}`),tema:"Exponenciales y logaritmos · Natural"}),
        ()=>({pregunta:`Expande ${texInline(`\\ln(x^${d}y^${a})`) }.`,respuesta:texInline(`${d}\\ln x+${a}\\ln y`),tema:"Exponenciales y logaritmos · Expansión"}),
        ()=>({pregunta:`Combina ${texInline(`${a}\\ln x+\\ln y`) }.`,respuesta:texInline(`\\ln(x^${a}y)`),tema:"Exponenciales y logaritmos · Combinación"}),
        ()=>({pregunta:`Resuelve ${texInline(`e^{${a}x}=e^${b}`)}.`,respuesta:texInline(`x=${fmt(b/a)}`),tema:"Exponenciales y logaritmos · Euler"}),
        ()=>({pregunta:`Calcula ${texInline(`\\log_${a}(${a**d})`)}.`,respuesta:String(d),tema:"Exponenciales y logaritmos · Base"}),
        ()=>({pregunta:`Resuelve ${texInline(`\\log_${a}x=${d}`)}.`,respuesta:texInline(`x=${a**d}`),tema:"Exponenciales y logaritmos · Ecuación"}),
        ()=>({pregunta:`Simplifica ${texInline(`e^{\\ln(${a}x)}`)}.`,respuesta:texInline(`${a}x`),tema:"Exponenciales y logaritmos · Inversas"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\ln(x-${a})`)}.`,respuesta:texInline(`(${a},\\infty)`),tema:"Exponenciales y logaritmos · Dominio"})
      ]; return gens[fam]();
    }
    if(subtema==="Trigonometría"){
      fam=familiaNivel(seed,nivel,{
        1:[0,1,5,7],2:[0,1,2,5,7],3:[2,3,4,5],4:[3,4,6,8,9],5:[3,4,6,8,9],6:[3,4,6,8,9],7:[3,4,6,8,9]
      });
      const gens=[
        ()=>({pregunta:`Calcula ${texInline(`${a}\\sin(\\pi/2)`) }.`,respuesta:String(a),tema:"Trigonometría · Valor"}),
        ()=>({pregunta:`Calcula ${texInline(`${a}\\cos(\\pi)`) }.`,respuesta:String(-a),tema:"Trigonometría · Valor"}),
        ()=>({pregunta:`Simplifica ${texInline(`${a}(\\sin^2x+\\cos^2x)`) }.`,respuesta:String(a),tema:"Trigonometría · Identidad"}),
        ()=>({pregunta:`Resuelve ${texInline(`${a}\\sin x=0`)} en ${texInline(`[0,2\\pi)`) }.`,respuesta:texInline(`x=0,\\pi`),tema:"Trigonometría · Ecuación"}),
        ()=>({pregunta:`Resuelve ${texInline(`${a}\\cos x=0`)} en ${texInline(`[0,2\\pi)`) }.`,respuesta:texInline(`x=\\pi/2,3\\pi/2`),tema:"Trigonometría · Ecuación"}),
        ()=>({pregunta:`Calcula ${texInline(`${a}\\tan(\\pi/4)`) }.`,respuesta:String(a),tema:"Trigonometría · Tangente"}),
        ()=>({pregunta:`Si ${texInline(`\\sin x=${a}/${a+1}`)}, expresa ${texInline(`\\cos^2x`) }.`,respuesta:texInline(`1-\\frac{${a*a}}{${(a+1)**2}}`),tema:"Trigonometría · Identidad"}),
        ()=>({pregunta:`Convierte ${a*30}° a radianes.`,respuesta:texInline(`\\frac{${a}\\pi}{6}`),tema:"Trigonometría · Conversión"}),
        ()=>({pregunta:`Periodo de ${texInline(`\\sin(${a}x)`) }.`,respuesta:texInline(`\\frac{2\\pi}{${a}}`),tema:"Trigonometría · Periodo"}),
        ()=>({pregunta:`Amplitud de ${texInline(`${a}\\cos x`) }.`,respuesta:String(a),tema:"Trigonometría · Amplitud"})
      ]; return gens[fam]();
    }
    if(subtema==="Dominio"){
      fam=familiaNivel(seed,nivel,{
        1:[0,1,4],2:[0,1,2,4],3:[2,5,6],4:[3,5,7],5:[7,8,9],6:[7,8,9],7:[3,7,8,9]
      });
      const gens=[
        ()=>({pregunta:`Dominio de ${texInline(`\\frac1{x-${a}}`) }.`,respuesta:texInline(`\\mathbb R\\setminus\\{${a}\\}`),tema:"Dominio · Racional"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\sqrt{x-${a}}`) }.`,respuesta:texInline(`[${a},\\infty)`),tema:"Dominio · Radical"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\ln(x-${a})`) }.`,respuesta:texInline(`(${a},\\infty)`),tema:"Dominio · Logaritmo"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\frac{\\sqrt{x-${a}}}{x-${b}}`) }.`,respuesta:`x≥${a} y x≠${b}.`,tema:"Dominio · Mixto"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\sqrt{${a}-x}`) }.`,respuesta:texInline(`(-\\infty,${a}]`),tema:"Dominio · Radical"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\frac1{\\sqrt{x-${a}}}`) }.`,respuesta:texInline(`(${a},\\infty)`),tema:"Dominio · Radical denominador"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\ln(${a}-x)`) }.`,respuesta:texInline(`(-\\infty,${a})`),tema:"Dominio · Log inverso"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\frac1{x^2-${a*a}}`) }.`,respuesta:`Todos los reales excepto ±${a}.`,tema:"Dominio · Cuadrático"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\sqrt{x^2-${a*a}}`) }.`,respuesta:texInline(`(-\\infty,-${a}]\\cup[${a},\\infty)`),tema:"Dominio · Radical cuadrático"}),
        ()=>({pregunta:`Dominio de ${texInline(`\\ln(x^2-${a*a})`) }.`,respuesta:texInline(`(-\\infty,-${a})\\cup(${a},\\infty)`),tema:"Dominio · Log cuadrático"})
      ]; return gens[fam]();
    }
    if(subtema==="Inecuaciones"){
      return {pregunta:`Resuelve ${texInline(`${a}x-${b}\\le ${c}x+${d}`)}.`,respuesta: a===c ? "Revisa si la desigualdad es siempre verdadera o falsa." : texInline(`x ${a-c>0?"\\le":"\\ge"} ${fmt((b+d)/(a-c))}`),tema:"Inecuaciones · Lineal"};
    }

    // algebra básica-only topics
    if(subtema==="Factorización"){
      if(lv<=2) return {pregunta:`Factoriza ${texInline(`${a}x^2+${a*b}x`) }.`,respuesta:texInline(`${a}x(x+${b})`),tema:"Factorización · Factor común"};
      if(lv<=4) return {pregunta:`Factoriza ${texInline(`x^2-${a+b}x+${a*b}`)}.`,respuesta:texInline(`(x-${a})(x-${b})`),tema:"Factorización · Trinomio"};
      return {pregunta:`Factoriza completamente ${texInline(`${a}x^3-${a*b*b}x`) }.`,respuesta:texInline(`${a}x(x-${b})(x+${b})`),tema:"Factorización · Mixta"};
    }
    if(subtema==="Productos notables"){
      return {pregunta:`Desarrolla ${texInline(`(${a}x-${b})^2`) }.`,respuesta:texInline(`${a*a}x^2-${2*a*b}x+${b*b}`),tema:"Productos notables · Cuadrado"};
    }
    if(subtema==="Fracciones algebraicas"){
      return {pregunta:`Simplifica ${texInline(`\\frac{x^2-${a*a}}{x-${a}}`) }, x≠${a}.`,respuesta:texInline(`x+${a}`),tema:"Fracciones algebraicas · Simplificación"};
    }
    if(subtema==="Polinomios"){
      return {pregunta:`Evalúa ${texInline(`P(x)=${a}x^2-${b}x+${c}`)} en x=${d}.`,respuesta:String(a*d*d-b*d+c),tema:"Polinomios · Evaluación"};
    }
    if(subtema==="Valor absoluto"){
      return {pregunta:`Resuelve ${texInline(`|x-${a}|=${b}`)}.`,respuesta:texInline(`x=${a+b}\\ \\text{o}\\ x=${a-b}`),tema:"Valor absoluto · Ecuación"};
    }
    if(subtema==="Sistemas"){
      const x=(seed%7)-3,y=((seed*2)%9)-4;
      return {pregunta:`Resuelve ${texInline(`\\begin{cases}x+y=${x+y}\\\\${a}x-y=${a*x-y}\\end{cases}`)}.`,respuesta:texInline(`x=${x},\\ y=${y}`),tema:"Sistemas · 2×2"};
    }
    return null;
  }

  function quimica(seed,nivel,subtema){
    const configs=[
      ["H",1,"1s¹"],["He",2,"1s²"],["Li",3,"1s² 2s¹"],["C",6,"1s² 2s² 2p²"],["N",7,"1s² 2s² 2p³"],
      ["O",8,"1s² 2s² 2p⁴"],["F",9,"1s² 2s² 2p⁵"],["Ne",10,"1s² 2s² 2p⁶"],["Na",11,"1s² 2s² 2p⁶ 3s¹"],["Mg",12,"1s² 2s² 2p⁶ 3s²"],
      ["Al",13,"1s² 2s² 2p⁶ 3s² 3p¹"],["Si",14,"1s² 2s² 2p⁶ 3s² 3p²"],["P",15,"1s² 2s² 2p⁶ 3s² 3p³"],["S",16,"1s² 2s² 2p⁶ 3s² 3p⁴"],["Cl",17,"1s² 2s² 2p⁶ 3s² 3p⁵"],["Ar",18,"1s² 2s² 2p⁶ 3s² 3p⁶"]
    ];
    if(subtema==="Configuración electrónica"){
      const x=configs[seed%configs.length];
      return {pregunta:`Caso ${seed%100+1}: escribe la configuración electrónica de ${x[0]} (Z=${x[1]}) e indica el número total de electrones.`,respuesta:`${x[2]}; total: ${x[1]} electrones.`,tema:subtema,subtema};
    }
    if(subtema==="Electronegatividad"){
      const els=[["H",2.20],["C",2.55],["N",3.04],["O",3.44],["F",3.98],["Na",0.93],["Mg",1.31],["Al",1.61],["Si",1.90],["P",2.19],["S",2.58],["Cl",3.16]];
      const e1=els[seed%els.length], e2=els[(seed*3+5)%els.length];
      const de=Math.abs(e1[1]-e2[1]).toFixed(2);
      return {pregunta:`Caso ${seed%100+1}: calcula ΔEN para el enlace ${e1[0]}–${e2[0]} y señala hacia qué átomo apunta el dipolo.`,respuesta:`ΔEN = ${de}; el dipolo apunta hacia ${e1[1]>=e2[1]?e1[0]:e2[0]}.`,tema:subtema,subtema};
    }
    if(subtema==="Fuerzas intermoleculares"){
      const mols=[["H₂O","puentes de hidrógeno"],["NH₃","puentes de hidrógeno"],["HF","puentes de hidrógeno"],["HCl","dipolo-dipolo"],["SO₂","dipolo-dipolo"],["CO₂","dispersión de London"],["CH₄","dispersión de London"],["Cl₂","dispersión de London"],["CH₃OH","puentes de hidrógeno"],["H₂S","dipolo-dipolo"]];
      const x=mols[seed%mols.length];
      return {pregunta:`Caso ${seed%100+1}: indica la fuerza intermolecular dominante en ${x[0]} y justifica según su polaridad/enlaces.`,respuesta:`${x[1]}. La justificación debe relacionar polaridad y posibilidad de puente de hidrógeno cuando corresponda.`,tema:subtema,subtema};
    }
    if(subtema==="Balanceo"){
      const rx=[
        ["H₂ + O₂ → H₂O","2H₂ + O₂ → 2H₂O"],["N₂ + H₂ → NH₃","N₂ + 3H₂ → 2NH₃"],["Fe + O₂ → Fe₂O₃","4Fe + 3O₂ → 2Fe₂O₃"],
        ["Na + Cl₂ → NaCl","2Na + Cl₂ → 2NaCl"],["Al + O₂ → Al₂O₃","4Al + 3O₂ → 2Al₂O₃"],["CH₄ + O₂ → CO₂ + H₂O","CH₄ + 2O₂ → CO₂ + 2H₂O"],
        ["C₂H₆ + O₂ → CO₂ + H₂O","2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O"],["KClO₃ → KCl + O₂","2KClO₃ → 2KCl + 3O₂"],["Mg + HCl → MgCl₂ + H₂","Mg + 2HCl → MgCl₂ + H₂"],["CaCO₃ → CaO + CO₂","CaCO₃ → CaO + CO₂"]
      ];
      const x=rx[seed%rx.length];
      return {pregunta:`Caso ${seed%100+1}: balancea con coeficientes enteros mínimos: ${x[0]}`,respuesta:x[1],tema:subtema,subtema};
    }
    if(subtema==="Polaridad y geometría"){
      const mols=[["H₂O","angular","polar"],["CO₂","lineal","apolar"],["NH₃","piramidal trigonal","polar"],["BF₃","trigonal plana","apolar"],["CH₄","tetraédrica","apolar"],["SO₂","angular","polar"],["BeCl₂","lineal","apolar"],["PCl₃","piramidal trigonal","polar"],["CCl₄","tetraédrica","apolar"],["SF₂","angular","polar"]];
      const x=mols[seed%mols.length];
      return {pregunta:`Caso ${seed%100+1}: determina geometría molecular y polaridad de ${x[0]} mediante VSEPR.`,respuesta:`${x[1]}; ${x[2]}.`,tema:subtema,subtema};
    }
    return null;
  }

  function multivariable(seed,nivel,subtema){
    const lv=nivelNum(nivel);
    const a=p(seed,1,6),b=q(seed,1,6),c=r(seed,1,5),fam=seed%10;
    if(subtema==="Derivadas parciales"){
      if(lv<=2) return {pregunta:`Para ${texInline(`f(x,y)=${a}x^2+${b}y^2`)}, calcula fx y fy.`,respuesta:texBlock(`f_x=${2*a}x,\\quad f_y=${2*b}y`),tema:subtema};
      if(lv<=4) return {pregunta:`Para ${texInline(`f(x,y)=${a}x^3+${b}x^2y+${c}y^2`)}, calcula fx y fy.`,respuesta:texBlock(`f_x=${3*a}x^2+${2*b}xy,\\quad f_y=${b}x^2+${2*c}y`),tema:subtema};
      return {pregunta:`Para ${texInline(`f(x,y)=e^{${a}xy}+${b}x^2y^3`)}, calcula fx, fy y fxy.`,respuesta:texBlock(`f_x=${a}y e^{${a}xy}+${2*b}xy^3,\\ f_y=${a}x e^{${a}xy}+${3*b}x^2y^2,\\ f_{xy}=${a}e^{${a}xy}+${a*a}xy e^{${a}xy}+${6*b}xy^2`),tema:subtema};
    }
    if(subtema==="Gradiente y derivada direccional"){
      const x=seed%5,y=(seed*2)%5;
      return {pregunta:`Para ${texInline(`f=${a}x^2+${b}xy+${c}y^2`)}, calcula ${texInline(`\\nabla f(${x},${y})`)}.`,respuesta:texBlock(`(${2*a*x+b*y},${b*x+2*c*y})`),tema:subtema};
    }
    if(subtema==="Plano tangente y linealización"){
      const x=seed%3,y=(seed+1)%3;
      const z=a*x*x+b*y*y;
      return {pregunta:`Plano tangente a ${texInline(`z=${a}x^2+${b}y^2`)} en (${x},${y},${z}).`,respuesta:texBlock(`z-${z}=${2*a*x}(x-${x})+${2*b*y}(y-${y})`),tema:subtema};
    }
    if(subtema==="Hessiano y extremos"){
      return {pregunta:`Hessiano de ${texInline(`f=${a}x^2+${b}xy+${c}y^2`) }.`,respuesta:texBlock(`H=\\begin{pmatrix}${2*a}&${b}\\\\${b}&${2*c}\\end{pmatrix}`),tema:subtema};
    }
    if(subtema==="Integrales dobles y triples"){
      const X=(seed%4)+1,Y=((seed*2)%4)+1;
      return {pregunta:`Calcula ${texBlock(`\\int_0^${X}\\int_0^${Y} ${a}xy\\,dy\\,dx`)}`,respuesta:texBlock(`${fmt(a*X*X*Y*Y/4)}`),tema:subtema};
    }
    if(subtema==="Cambio de variables y polares"){
      const R=a+2;
      return {pregunta:`Convierte la región ${texInline(`x^2+y^2\\le ${R*R}`)} a coordenadas polares.`,respuesta:texBlock(`0\\le r\\le ${R},\\quad0\\le\\theta\\le2\\pi`),tema:subtema};
    }
    if(subtema==="Multiplicadores de Lagrange"){
      const S=a+4;
      return {pregunta:`Minimiza ${texInline(`x^2+y^2`)} sujeto a ${texInline(`x+y=${S}`)}.`,respuesta:texBlock(`x=y=${fmt(S/2)},\\quad f_{min}=${fmt(S*S/2)}`),tema:subtema};
    }
    return null;
  }

  function fisica(seed,nivel,subtema){
    const lv=nivelNum(nivel);
    const a=p(seed,2,12),b=q(seed,1,10),c=r(seed,1,8);
    let fam=seed%10;
    if(subtema==="Cinemática"){
      fam=familiaNivel(seed,nivel,{
        1:[1,4,8],2:[0,1,4,8],3:[0,2,3,7],4:[2,3,5,6,7],5:[5,6,9],6:[5,6,7,9],7:[0,2,3,5,6,7,9]
      });
      const gens=[
        ()=>({pregunta:`Un móvil parte del reposo con a=${a} m/s² durante ${b} s. Halla v final.`,respuesta:`${a*b} m/s`,tema:subtema}),
        ()=>({pregunta:`Un móvil viaja a ${a} m/s durante ${b} s. Halla el desplazamiento.`,respuesta:`${a*b} m`,tema:subtema}),
        ()=>({pregunta:`Desde reposo, a=${a} m/s² durante ${b} s. Halla desplazamiento.`,respuesta:`${fmt(0.5*a*b*b)} m`,tema:subtema}),
        ()=>({pregunta:`v0=${a} m/s, a=${b} m/s², t=${c} s. Halla v.`,respuesta:`${a+b*c} m/s`,tema:subtema}),
        ()=>({pregunta:`Un móvil recorre ${a*b} m en ${b} s con velocidad constante. Halla v.`,respuesta:`${a} m/s`,tema:subtema}),
        ()=>({pregunta:`Caída libre durante ${b} s. Usa g=9.8 m/s². Halla v.`,respuesta:`${fmt(9.8*b)} m/s`,tema:subtema}),
        ()=>({pregunta:`Lanzamiento vertical con v0=${a*2} m/s. Usa g=10. Halla tiempo al punto más alto.`,respuesta:`${fmt(a/5)} s`,tema:subtema}),
        ()=>({pregunta:`Un móvil cambia de ${a} a ${a+b} m/s en ${c} s. Halla aceleración media.`,respuesta:`${fmt(b/c)} m/s²`,tema:subtema}),
        ()=>({pregunta:`MRU: x0=${a} m, v=${b} m/s. Halla x(${c}s).`,respuesta:`${a+b*c} m`,tema:subtema}),
        ()=>({pregunta:`Si v=${a}+${b}t, halla v en t=${c}s.`,respuesta:`${a+b*c} m/s`,tema:subtema})
      ]; return gens[fam]();
    }
    if(subtema==="Dinámica y fuerzas"){
      const m=a,F=b*10;
      if(lv<=2) return {pregunta:`Una masa de ${m} kg recibe una fuerza neta de ${F} N. Halla su aceleración.`,respuesta:`${fmt(F/m)} m/s²`,tema:subtema};
      const mu=(seed%5+1)/10, N=m*9.8, fr=mu*N;
      return {pregunta:`Un bloque de ${m} kg recibe ${F} N horizontales sobre una superficie con μ=${mu}. Usa g=9.8. Halla roce y aceleración.`,respuesta:`f=${fmt(fr)} N; a=${fmt((F-fr)/m)} m/s²`,tema:subtema};
    }
    if(subtema==="Trabajo y energía"){
      if(lv<=2) return {pregunta:`Una fuerza constante de ${a*10} N desplaza un objeto ${b} m en su misma dirección. Halla el trabajo.`,respuesta:`${a*10*b} J`,tema:subtema};
      return {pregunta:`Un cuerpo de ${a} kg parte del reposo. Un trabajo neto de ${a*10*b} J actúa sobre él. Halla su rapidez final.`,respuesta:`${fmt(Math.sqrt(2*a*10*b/a))} m/s`,tema:subtema};
    }
    if(subtema==="Momento y colisiones"){
      if(lv<=2) return {pregunta:`Una masa de ${a} kg se mueve a ${b} m/s. Halla su momento lineal.`,respuesta:`${a*b} kg·m/s`,tema:subtema};
      const m2=c+1,v2=-(seed%5+1);
      return {pregunta:`Choque perfectamente inelástico: m1=${a} kg a ${b} m/s y m2=${m2} kg a ${v2} m/s. Halla la velocidad conjunta.`,respuesta:`${fmt((a*b+m2*v2)/(a+m2))} m/s`,tema:subtema};
    }
    if(subtema==="Movimiento circular y rotación"){
      return {pregunta:`Un cuerpo gira con ω=${a} rad/s y radio ${b} m. Halla rapidez tangencial.`,respuesta:`${a*b} m/s`,tema:subtema};
    }
    if(subtema==="Electricidad y circuitos"){
      return {pregunta:`Una resistencia de ${a} Ω se conecta a ${a*b} V. Halla la corriente.`,respuesta:`${b} A`,tema:subtema};
    }
    if(subtema==="Fluidos"){
      const rho=1000,h=b;
      return {pregunta:`Presión hidrostática a ${h} m en agua. Usa ρ=1000 kg/m³ y g=9.8.`,respuesta:`${9800*h} Pa`,tema:subtema};
    }
    if(subtema==="Oscilaciones"){
      const k=a*10,m=b;
      return {pregunta:`Sistema masa-resorte con k=${k} N/m y m=${m} kg. Halla ω.`,respuesta:`${fmt(Math.sqrt(k/m))} rad/s`,tema:subtema};
    }
    if(subtema==="Calor y termodinámica"){
      const m=a,cc=4200,dt=b;
      return {pregunta:`Calienta ${m} kg de agua ${dt} °C. Usa c=4200 J/(kg·°C). Halla Q.`,respuesta:`${m*cc*dt} J`,tema:subtema};
    }
    if(subtema==="Gravitación"){
      const M=a*1e10, rr=b*100;
      const G=6.67e-11;
      return {pregunta:`Dos masas ${M.toExponential(1)} kg y 1 kg están separadas ${rr} m. Halla F gravitatoria.`,respuesta:`${fmt(G*M/(rr*rr))} N`,tema:subtema};
    }
    return null;
  }

  function estadistica(seed,nivel,subtema){
    const lv=nivelNum(nivel);
    const a=p(seed,2,10),b=q(seed,2,10),c=r(seed,1,8),fam=seed%10;
    if(subtema==="Estadística descriptiva"){
      const datos=[a,b,c,a+c,b+c];
      const media=datos.reduce((s,x)=>s+x,0)/datos.length;
      if(lv<=2) return {pregunta:`Calcula la media de ${datos.join(", ")}.`,respuesta:fmt(media),tema:subtema};
      const varp=datos.reduce((s,x)=>s+(x-media)**2,0)/datos.length;
      if(lv<=4) return {pregunta:`Para ${datos.join(", ")}, calcula media y varianza poblacional.`,respuesta:`media=${fmt(media)}, varianza=${fmt(varp)}`,tema:subtema};
      return {pregunta:`Para ${datos.join(", ")}, calcula media, varianza poblacional y desviación estándar.`,respuesta:`media=${fmt(media)}, varianza=${fmt(varp)}, σ=${fmt(Math.sqrt(varp))}`,tema:subtema};
    }
    if(subtema==="Probabilidad"){
      return {pregunta:`Una urna tiene ${a} rojas y ${b} azules. Probabilidad de extraer una roja.`,respuesta:texInline(`\\frac{${a}}{${a+b}}`),tema:subtema};
    }
    if(subtema==="Variables aleatorias"){
      const pp=[0.2,0.3,0.4,0.5,0.6][seed%5];
      return {pregunta:`Para ${a} variables iid X~Bernoulli(${pp}), halla la esperanza de su suma S.`,respuesta:`E[S]=${fmt(a*pp)}`,tema:subtema};
    }
    if(subtema==="Distribución binomial"){
      const n=a+5,pp=[0.2,0.3,0.4,0.5][seed%4];
      return {pregunta:`Si X~Bin(${n},${pp}), halla E[X].`,respuesta:fmt(n*pp),tema:subtema};
    }
    if(subtema==="Distribución normal"){
      const mu=a*10,sigma=b,x=mu+2*sigma;
      return {pregunta:`Si X~N(${mu},${sigma}²), estandariza x=${x}.`,respuesta:"z=2",tema:subtema};
    }
    if(subtema==="Inferencia estadística"){
      const n=(seed%8+3)**2, sigma=a, z=1.96;
      return {pregunta:`Con σ=${sigma}, n=${n}, ¿cuál es el margen de error 95% para la media?`,respuesta:fmt(z*sigma/Math.sqrt(n)),tema:subtema};
    }
    if(subtema==="Correlación y regresión"){
      const rr=[-0.92,-0.75,-0.45,0.15,0.42,0.71,0.93][seed%7];
      const desc=Math.abs(rr)>0.8?"muy fuerte":Math.abs(rr)>0.6?"fuerte":Math.abs(rr)>0.3?"moderada":"débil";
      return {pregunta:`En una muestra de n=${a+10}, interpreta el coeficiente r=${rr}.`,respuesta:`Correlación ${rr>0?"positiva":"negativa"} ${desc}.`,tema:subtema};
    }
    return null;
  }

  function programacion(seed,nivel,subtema){
    const lv=nivelNum(nivel);
    const a=p(seed,2,9),b=q(seed,2,9),fam=seed%10;
    if(subtema==="Variables y operadores"){
      return {pregunta:`¿Qué imprime?<pre><code>x=${a}\ny=${b}\nprint(x*y + x)</code></pre>`,respuesta:String(a*b+a),tema:subtema};
    }
    if(subtema==="Condicionales"){
      return {pregunta:`Completa una condición que imprima "par" si n=${a*b} es par.`,respuesta:`<pre><code>if n % 2 == 0:\n    print("par")</code></pre>`,tema:subtema};
    }
    if(subtema==="Bucles"){
      const n=a+4;
      if(lv<=2) return {pregunta:`¿Qué suma produce?<pre><code>s=0\nfor i in range(1, ${n+1}):\n    s += i</code></pre>`,respuesta:String(n*(n+1)/2),tema:subtema};
      if(lv<=4) return {pregunta:`¿Qué imprime?<pre><code>s=0\nfor i in range(1, ${n+1}):\n    if i % 2 == 0:\n        s += i*i\nprint(s)</code></pre>`,respuesta:String(Array.from({length:n},(_,k)=>k+1).filter(i=>i%2===0).reduce((s,i)=>s+i*i,0)),tema:subtema};
      return {pregunta:`Analiza la complejidad y salida de:<pre><code>s=0\nfor i in range(1, ${n+1}):\n    for j in range(i):\n        if (i+j)%2==0:\n            s += 1\nprint(s)</code></pre>`,respuesta:`Salida: ${(()=>{let t=0;for(let i=1;i<=n;i++)for(let j=0;j<i;j++)if((i+j)%2===0)t++;return t;})()}. Complejidad temporal O(n²).`,tema:subtema};
    }
    if(subtema==="Listas y comprensiones"){
      const n=a+6;
      return {pregunta:`Escribe una comprensión con los cuadrados pares de 1 a ${n}.`,respuesta:`<pre><code>[x**2 for x in range(1, ${n+1}) if x % 2 == 0]</code></pre>`,tema:subtema};
    }
    if(subtema==="Diccionarios"){
      return {pregunta:`Obtén el valor de "stock" desde <pre><code>p={"nombre":"A","stock":${a}}</code></pre>`,respuesta:`<pre><code>p["stock"]</code></pre> → ${a}`,tema:subtema};
    }
    if(subtema==="Funciones"){
      return {pregunta:`Escribe una función que retorne ${a} veces un número x.`,respuesta:`<pre><code>def f(x):\n    return ${a}*x</code></pre>`,tema:subtema};
    }
    if(subtema==="Archivos y JSON"){
      return {pregunta:`Escribe código para leer datos${a}.json.`,respuesta:`<pre><code>import json\nwith open("datos${a}.json","r",encoding="utf-8") as f:\n    datos=json.load(f)</code></pre>`,tema:subtema};
    }
    if(subtema==="Excepciones"){
      return {pregunta:`Captura ValueError al convertir la variable texto_${a} a entero.`,respuesta:`<pre><code>try:\n    n=int(texto_${a})\nexcept ValueError:\n    print("Entrada inválida")</code></pre>`,tema:subtema};
    }
    if(subtema==="Programación orientada a objetos"){
      return {pregunta:`Crea una clase Caja con atributo volumen=${a*b}.`,respuesta:`<pre><code>class Caja:\n    def __init__(self, volumen=${a*b}):\n        self.volumen=volumen</code></pre>`,tema:subtema};
    }
    return null;
  }



  function sellarExtremo(e,seed){
    if(!e) return e;
    const variante=((seed%100)+100)%100+1;
    e.pregunta=`<span class="extreme-case">Desafío extremo ${variante}/100</span><br>`+e.pregunta;
    e.tema=(e.tema||"Nivel 6")+" · EXTREMO";
    e.pistas=e.pistas||[
      {titulo:"Pista 1",texto:"Identifica todas las técnicas involucradas antes de comenzar; este ejercicio no está diseñado para resolverse con una sola regla."},
      {titulo:"Pista 2",texto:"Divide el problema en subproblemas, resuelve cada etapa por separado y conserva resultados simbólicos el mayor tiempo posible."},
      {titulo:"Desarrollo",texto:"En Nivel 6 conviene justificar cada transformación y verificar dominio, unidades, restricciones o condiciones según el curso."}
    ];
    return e;
  }

  function nivel6Extremo(ramo,subtema,seed){
    const a=2+(seed%17);
    const b=3+((seed*3)%19);
    const c=2+((seed*5)%13);
    const d=2+((seed*7)%9);
    const k=2+(seed%5);

    // CÁLCULO DIFERENCIAL
    if(ramo==="calculo_diferencial"){
      if(subtema==="Exponenciales") return calcDiff(seed,6,subtema);
      if(subtema==="Derivadas"){
        return {
          pregunta:`Deriva y simplifica ${texInline(`f(x)=\\frac{x^${k}e^{\\sin(${a}x^2)}}{\\ln(x+${b})}\\sqrt{${c}x^2+1}`)}.`,
          respuesta:texBlock(
            `f'(x)=f(x)\\left(\\frac{${k}}x+${2*a}x\\cos(${a}x^2)-\\frac{1}{(x+${b})\\ln(x+${b})}+\\frac{${c}x}{${c}x^2+1}\\right)`
          ),
          tema:"Derivadas · extrema multirregla"
        };
      }
      if(subtema==="Regla de la cadena"){
        return {
          pregunta:`Deriva la composición ${texInline(`y=\\ln\\!\\left(1+e^{\\sin((x^2+${a}x+${b})^${k})}\\right)`)}.`,
          respuesta:texBlock(
            `y'=\\frac{e^{\\sin(u^${k})}}{1+e^{\\sin(u^${k})}}\\cos(u^${k})\\cdot ${k}u^{${k-1}}(2x+${a}),\\quad u=x^2+${a}x+${b}`
          ),
          tema:"Regla de la cadena · composición cuádruple"
        };
      }
      if(subtema==="Derivación implícita"){
        return {
          pregunta:`Para ${texInline(`e^{xy}+\\ln(x^2+y^2)+x\\sin y+y\\cos x=${a}`)}, calcula ${texInline(`dy/dx`)}.`,
          respuesta:texBlock(
            `y'=-\\frac{ye^{xy}+\\frac{2x}{x^2+y^2}+\\sin y-y\\sin x}{xe^{xy}+\\frac{2y}{x^2+y^2}+x\\cos y+\\cos x}`
          ),
          tema:"Derivación implícita · extrema mixta"
        };
      }
      if(subtema==="Tasas de cambio"){
        return {
          pregunta:`Un cono cambia con ${texInline(`r=h^2/${a}`)} y ${texInline(`dh/dt=${b}`)} cm/s. Para ${texInline(`V=\\frac13\\pi r^2h`)}, halla ${texInline(`dV/dt`)} cuando ${texInline(`h=${c}`)}.`,
          respuesta:texBlock(
            `V=\\frac{\\pi h^5}{3${a*a}},\\quad \\frac{dV}{dt}=\\frac{5\\pi h^4}{3${a*a}}\\frac{dh}{dt}=\\frac{${5*b*c**4}}{${3*a*a}}\\pi`
          ),
          tema:"Tasas de cambio · restricción no lineal"
        };
      }
      if(subtema==="Integrales indefinidas"){
        return {
          pregunta:`Calcula ${texBlock(`\\int x^${k}e^{${a}x}\\cos(${b}x)\\,dx`)}`,
          respuesta:`Requiere integración por partes repetida combinada con la integral cíclica de ${texInline(`e^{${a}x}\\cos(${b}x)`)}. Una forma compacta es obtener primero ${texInline(`\\int e^{${a}x}\\cos(${b}x)dx=\\frac{e^{${a}x}(${a}\\cos(${b}x)+${b}\\sin(${b}x))}{${a*a+b*b}}`)} y aplicar partes ${k} veces.`,
          tema:"Integrales indefinidas · extrema por partes"
        };
      }
      if(subtema==="Integrales definidas"){
        return {
          pregunta:`Evalúa ${texBlock(`\\int_0^1 \\frac{x^${2*k+1}}{(1+x^2)^${k+1}}\\,dx`)}`,
          respuesta:`Usa ${texInline(`u=1+x^2`)}. La integral se reduce a una combinación racional-logarítmica en u entre 1 y 2; desarrolla ${texInline(`x^{${2*k}}=(u-1)^${k}`)} antes de integrar.`,
          tema:"Integrales definidas · sustitución y expansión"
        };
      }
      if(subtema==="Sustitución"){
        return {
          pregunta:`Calcula ${texBlock(`\\int \\frac{x\\,e^{x^2}}{1+e^{2x^2}}\\,dx`)}`,
          respuesta:texBlock(`\\frac12\\arctan(e^{x^2})+C`),
          tema:"Sustitución · doble composición"
        };
      }
      if(subtema==="Integración por partes"){
        return {
          pregunta:`Calcula ${texBlock(`\\int x^${k}\\ln(x)e^{${a}x}\\,dx`)}`,
          respuesta:`Nivel extremo: aplica integración por partes repetida. Una estrategia eficiente es tomar ${texInline(`u=x^${k}\\ln x`)} y ${texInline(`dv=e^{${a}x}dx`)}, repitiendo hasta eliminar el polinomio.`,
          tema:"Integración por partes · repetida con log-exp"
        };
      }
    }

    // ÁLGEBRA LINEAL
    if(ramo==="algebra_lineal"){
      if(subtema==="Matrices y operaciones"){
        return {
          pregunta:`Sean ${texInline(`A=\\begin{pmatrix}${a}&1&0\\\\0&${b}&1\\\\1&0&${c}\\end{pmatrix}`)} y ${texInline(`B=A^2-${d}A+${k}I`)}. Calcula ${texInline(`\\operatorname{tr}(B)`)} sin multiplicar toda la matriz.`,
          respuesta:texBlock(`\\operatorname{tr}(B)=\\operatorname{tr}(A^2)-${d}\\operatorname{tr}(A)+${3*k}`),
          tema:"Matrices y operaciones · identidad de trazas"
        };
      }
      if(subtema==="Determinantes"){
        return {
          pregunta:`Calcula ${texInline(`\\det\\begin{pmatrix}${a}&1&1\\\\1&${b}&1\\\\1&1&${c}\\end{pmatrix}`)} usando operaciones por filas o expansión inteligente.`,
          respuesta:texBlock(`${a*b*c-a-b-c+2}`),
          tema:"Determinantes · 3×3 no triangular"
        };
      }
      if(subtema==="Inversas"){
        return {
          pregunta:`Para ${texInline(`A=\\begin{pmatrix}${a}&1&0\\\\0&${b}&1\\\\1&0&${c}\\end{pmatrix}`)}, determina si es invertible y, si lo es, obtiene ${texInline(`A^{-1}`)} mediante Gauss-Jordan.`,
          respuesta:`${texInline(`\\det(A)=${a*b*c+1}`)}. Como es distinto de 0, A es invertible. El desarrollo completo requiere Gauss-Jordan sobre ${texInline(`[A|I]`)}.`,
          tema:"Inversas · 3×3 por Gauss-Jordan"
        };
      }
      if(subtema==="Sistemas lineales"){
        const x=seed%7-3,y=(seed*2)%9-4,z=(seed*3)%11-5;
        return {
          pregunta:`Resuelve el sistema ${texInline(`\\begin{cases}${a}x+y+z=${a*x+y+z}\\\\x+${b}y+z=${x+b*y+z}\\\\x+y+${c}z=${x+y+c*z}\\end{cases}`)}.`,
          respuesta:texBlock(`x=${x},\\ y=${y},\\ z=${z}`),
          tema:"Sistemas lineales · 3×3"
        };
      }
      if(subtema==="Vectores y espacios"){
        return {
          pregunta:`Determina una base y la dimensión del subespacio de ${texInline(`\\mathbb R^4`)} definido por ${texInline(`x_1+x_2+x_3+x_4=0`)} y ${texInline(`${a}x_1+x_2-${b}x_3=0`)}.`,
          respuesta:`Reduce el sistema homogéneo. Con dos restricciones linealmente independientes, la dimensión es ${texInline("4-2=2")}.`,
          tema:"Vectores y espacios · base de subespacio"
        };
      }
      if(subtema==="Valores propios"){
        return {
          pregunta:`Halla valores propios y multiplicidades de ${texInline(`A=\\begin{pmatrix}${a}&1&0\\\\0&${a}&1\\\\0&0&${b}\\end{pmatrix}`)}.`,
          respuesta:texBlock(`\\lambda=${a}\\ \\text{(mult. alg. 2)},\\quad \\lambda=${b}\\ \\text{(mult. alg. 1)}`),
          tema:"Valores propios · multiplicidad"
        };
      }
      if(subtema==="Diagonalización"){
        return {
          pregunta:`Analiza si ${texInline(`A=\\begin{pmatrix}${a}&1&0\\\\0&${a}&0\\\\0&0&${b}\\end{pmatrix}`)} es diagonalizable y justifica usando dimensiones de espacios propios.`,
          respuesta:`Para ${texInline(`\\lambda=${a}`)} la multiplicidad algebraica es 2 pero el bloque de Jordan produce un espacio propio de dimensión 1; por tanto A no es diagonalizable.`,
          tema:"Diagonalización · criterio geométrico"
        };
      }
    }

    // CÁLCULO BÁSICO / ÁLGEBRA BÁSICA
    if(ramo==="calculo_basico"){
      if(subtema==="Ecuaciones"){
        return {
          pregunta:`Resuelve ${texInline(`\\sqrt{x+${a}}+\\sqrt{${b}x+${c}}=${d}x`)} y verifica soluciones extrañas.`,
          respuesta:`Aísla una raíz, eleva al cuadrado dos veces y verifica cada candidato en la ecuación original.`,
          tema:"Ecuaciones · radical de dos etapas"
        };
      }
      if(subtema==="Potencias y radicales"){
        return {
          pregunta:`Simplifica ${texInline(`\\frac{\\sqrt[3]{x^{${3*k+1}}}\\sqrt{x^{${2*k+1}}}}{x^${k}}`) } para ${texInline(`x>0`)}.`,
          respuesta:texBlock(`x^{\\frac{${3*k+1}}3+\\frac{${2*k+1}}2-${k}}`),
          tema:"Potencias y radicales · exponentes racionales"
        };
      }
      if(subtema==="Exponenciales y logaritmos"){
        return {
          pregunta:`Resuelve ${texInline(`\\ln(x-${a})+\\ln(x+${b})=${c}x`)} indicando dominio.`,
          respuesta:`Dominio: ${texInline(`x>${a}`)}. La ecuación equivale a ${texInline(`(x-${a})(x+${b})=e^{${c}x}`)}, que en general requiere análisis numérico.`,
          tema:"Exponenciales y logaritmos · trascendente"
        };
      }
      if(subtema==="Trigonometría"){
        return {
          pregunta:`Resuelve en ${texInline(`[0,2\\pi)`) } la ecuación ${texInline(`2\\sin^2x+${a%5+1}\\sin x\\cos x-\\cos^2x=0`)}.`,
          respuesta:`Divide por ${texInline(`\\cos^2x`)} cuando corresponda y resuelve una cuadrática en ${texInline(`\\tan x`)}, revisando además los casos ${texInline(`\\cos x=0`)}.`,
          tema:"Trigonometría · cuadrática trigonométrica"
        };
      }
      if(subtema==="Dominio"){
        return {
          pregunta:`Determina el dominio de ${texInline(`f(x)=\\sqrt{\\ln\\!\\left(\\frac{x-${a}}{x+${b}}\\right)-\\frac1{x-${c}}}`)}.`,
          respuesta:`Debes imponer simultáneamente argumento del logaritmo >0, ${texInline(`x\\ne${c}`)} y que toda la expresión bajo la raíz sea ≥0. Requiere análisis por intervalos.`,
          tema:"Dominio · composición múltiple"
        };
      }
      if(subtema==="Inecuaciones"){
        return {
          pregunta:`Resuelve ${texInline(`\\frac{(x-${a})(x+${b})}{(x-${c})(x+${d})}\\ge 1`)}.`,
          respuesta:`Lleva todo a un solo cociente, factoriza y construye una tabla de signos con todos los puntos críticos.`,
          tema:"Inecuaciones · racional avanzada"
        };
      }
    }

    if(ramo==="algebra_basica"){
      if(subtema==="Factorización"){
        return {
          pregunta:`Factoriza completamente ${texInline(`x^4-${a+b}x^3+${a*b-c*c}x^2+${c*c*(a+b)}x-${a*b*c*c}`)}.`,
          respuesta:texInline(`(x-${a})(x-${b})(x-${c})(x+${c})`),
          tema:"Factorización · cuártica estructurada"
        };
      }
      if(subtema==="Productos notables"){
        return {
          pregunta:`Desarrolla y simplifica ${texInline(`((x+${a})^2-(x-${b})^2)^2`)}.`,
          respuesta:`Primero usa diferencia de cuadrados y luego vuelve a elevar al cuadrado.`,
          tema:"Productos notables · composición"
        };
      }
      if(subtema==="Fracciones algebraicas"){
        return {
          pregunta:`Simplifica ${texInline(`\\frac{x^2-${a*a}}{x^2-${b*b}}\\div\\frac{x-${a}}{x-${b}}`)} e indica todas las restricciones.`,
          respuesta:texInline(`\\frac{x+${a}}{x+${b}}`)+`. Restricciones: ${texInline(`x\\ne\\pm${b},\\ x\\ne${a}`)}.`,
          tema:"Fracciones algebraicas · división y restricciones"
        };
      }
      if(subtema==="Polinomios"){
        return {
          pregunta:`Sea ${texInline(`P(x)=x^4-${a}x^3+${b}x^2-${c}x+${d}`)}. Divide por ${texInline(`x-${k}`)} y determina cociente y resto.`,
          respuesta:`Usa Ruffini con ${texInline(`x=${k}`)}. El resto es ${texInline(`P(${k})`) }.`,
          tema:"Polinomios · Ruffini avanzado"
        };
      }
      if(subtema==="Valor absoluto"){
        return {
          pregunta:`Resuelve ${texInline(`|x-${a}|+|2x+${b}|=${c}x+${d}`)}.`,
          respuesta:`Separa la recta en los puntos críticos ${texInline(`x=${a}`)} y ${texInline(`x=-${b}/2`)} y resuelve por tramos.`,
          tema:"Valor absoluto · por tramos"
        };
      }
      if(subtema==="Inecuaciones"){
        return {
          pregunta:`Resuelve ${texInline(`\\frac{|x-${a}|}{x-${b}}>\\frac{x+${c}}{x-${d}}`)}.`,
          respuesta:`Debes separar por el valor absoluto y por los ceros de ambos denominadores; luego hacer tablas de signos por intervalos.`,
          tema:"Inecuaciones · valor absoluto racional"
        };
      }
      if(subtema==="Sistemas"){
        return {
          pregunta:`Resuelve ${texInline(`\\begin{cases}x^2+y^2=${a*a+b*b}\\\\xy=${a*b}\\end{cases}`)}.`,
          respuesta:`Usa ${texInline(`(x+y)^2=x^2+y^2+2xy`)} y ${texInline(`(x-y)^2=x^2+y^2-2xy`)}, generando las combinaciones de signos.`,
          tema:"Sistemas · no lineal"
        };
      }
    }

    // QUÍMICA
    if(ramo==="quimica_general"){
      if(subtema==="Configuración electrónica"){
        return {
          pregunta:`Para un átomo con Z=${20+(seed%17)}, escribe configuración electrónica completa, abreviada, electrones de valencia y número de electrones desapareados.`,
          respuesta:`Nivel extremo: aplica Aufbau, Hund y Pauli; luego identifica la capa de valencia y cuenta orbitales semillenos.`,
          tema:"Configuración electrónica · análisis completo"
        };
      }
      if(subtema==="Electronegatividad"){
        return {
          pregunta:`Compara los enlaces H–X para X de un mismo período y ordena polaridad, carácter iónico relativo y dirección del dipolo. Caso ${seed%100+1}.`,
          respuesta:`Usa diferencias de electronegatividad y tendencia periódica; justifica el orden, no solo el valor numérico.`,
          tema:"Electronegatividad · comparación periódica"
        };
      }
      if(subtema==="Fuerzas intermoleculares"){
        return {
          pregunta:`Ordena por punto de ebullición esperado tres sustancias que combinen London, dipolo-dipolo y puente de hidrógeno, justificando tamaño, polarizabilidad y geometría. Caso ${seed%100+1}.`,
          respuesta:`La respuesta debe ponderar simultáneamente tipo de fuerza, masa/polarizabilidad y posibilidad real de puente de hidrógeno.`,
          tema:"Fuerzas intermoleculares · comparación multivariable"
        };
      }
      if(subtema==="Balanceo"){
        return {
          pregunta:`Balancea en medio ácido una reacción redox del tipo ${texInline(`MnO_4^-+Fe^{2+}\\rightarrow Mn^{2+}+Fe^{3+}`)} y explica electrones transferidos. Variante ${seed%100+1}.`,
          respuesta:`Método ion-electrón. Base: ${texInline(`MnO_4^-+8H^++5Fe^{2+}\\rightarrow Mn^{2+}+4H_2O+5Fe^{3+}`)}.`,
          tema:"Balanceo · redox en medio ácido"
        };
      }
      if(subtema==="Polaridad y geometría"){
        return {
          pregunta:`Para una especie hipervalente, determina Lewis, cargas formales, geometría electrónica, geometría molecular, hibridación aproximada y polaridad. Caso ${seed%100+1}.`,
          respuesta:`Nivel extremo: requiere Lewis + VSEPR + simetría de dipolos + cargas formales.`,
          tema:"Polaridad y geometría · análisis completo"
        };
      }
    }

    // MULTIVARIABLE
    if(ramo==="calculo_multivariable"){
      if(subtema==="Derivadas parciales"){
        return {
          pregunta:`Para ${texInline(`f(x,y)=e^{xy}\\sin(${a}x^2y)+\\ln(x^2+y^2)`)}, calcula ${texInline(`f_{xx},f_{xy},f_{yy}`)}.`,
          respuesta:`Calcula primero fx y fy y luego deriva nuevamente. Debes combinar producto, cadena, exponencial, trigonometría y logaritmo.`,
          tema:"Derivadas parciales · segundas mixtas"
        };
      }
      if(subtema==="Gradiente y derivada direccional"){
        return {
          pregunta:`Para ${texInline(`f(x,y,z)=x^2y+yz^2+e^{xz}`)}, calcula el gradiente en (${a%4+1},${b%4+1},${c%4+1}) y la derivada direccional hacia el punto (${d},${k},${a%5+1}).`,
          respuesta:`Forma ${texInline(`\\nabla f`)}, evalúa, construye el vector dirección entre puntos, normalízalo y calcula el producto punto.`,
          tema:"Gradiente y derivada direccional · R3"
        };
      }
      if(subtema==="Plano tangente y linealización"){
        return {
          pregunta:`Obtén el plano tangente a la superficie implícita ${texInline(`x^2y+yz^2+e^{xz}=${a}`)} en un punto regular dado y expresa la linealización.`,
          respuesta:`Usa el gradiente de ${texInline(`F(x,y,z)`)} como vector normal: ${texInline(`\\nabla F(P)\\cdot((x,y,z)-P)=0`) }.`,
          tema:"Plano tangente y linealización · implícita"
        };
      }
      if(subtema==="Hessiano y extremos"){
        return {
          pregunta:`Encuentra y clasifica todos los puntos críticos de ${texInline(`f(x,y)=x^4+y^4-${a}x^2-${b}y^2+${c}xy`)}.`,
          respuesta:`Resuelve ${texInline(`\\nabla f=0`)} y clasifica cada candidato mediante el Hessiano. El sistema es no lineal.`,
          tema:"Hessiano y extremos · polinomio cuártico"
        };
      }
      if(subtema==="Integrales dobles y triples"){
        return {
          pregunta:`Evalúa ${texBlock(`\\iiint_E (x^2+y^2)\\,dV`) } donde E es la esfera ${texInline(`x^2+y^2+z^2\\le ${a*a}`)}.`,
          respuesta:`Usa coordenadas esféricas: ${texInline(`x^2+y^2=\\rho^2\\sin^2\\phi`)}, Jacobiano ${texInline(`\\rho^2\\sin\\phi`)}, con límites esféricos completos.`,
          tema:"Integrales dobles y triples · esféricas"
        };
      }
      if(subtema==="Cambio de variables y polares"){
        return {
          pregunta:`Evalúa una integral sobre una elipse ${texInline(`x^2/${a*a}+y^2/${b*b}\\le1`)} usando ${texInline(`x=${a}r\\cos\\theta,\\ y=${b}r\\sin\\theta`)} y calcula el Jacobiano.`,
          respuesta:texInline(`|J|=${a*b}r`)+`. Luego integra con ${texInline(`0\\le r\\le1,\\ 0\\le\\theta\\le2\\pi`) }.`,
          tema:"Cambio de variables y polares · Jacobiano"
        };
      }
      if(subtema==="Multiplicadores de Lagrange"){
        return {
          pregunta:`Extremiza ${texInline(`f(x,y,z)=xyz`)} sujeto a ${texInline(`x^2+y^2+z^2=${a*a}`)} y ${texInline(`x+y+z=${b}`)}.`,
          respuesta:`Plantea ${texInline(`\\nabla f=\\lambda\\nabla g+\\mu\\nabla h`)} junto con ambas restricciones. Es un sistema de 5 ecuaciones.`,
          tema:"Multiplicadores de Lagrange · dos restricciones"
        };
      }
    }

    // FÍSICA
    if(ramo==="fisica"){
      if(subtema==="Cinemática"){
        return {
          pregunta:`Un proyectil se lanza desde altura ${a} m con rapidez ${b+20} m/s a ${30+(seed%40)}°. Determina tiempo de vuelo, alcance horizontal y rapidez justo antes de impactar. Usa g=9.8.`,
          respuesta:`Descompón velocidad inicial, resuelve la cuadrática vertical para t, luego x=v0x·t y finalmente combina vx con vy(t).`,
          tema:"Cinemática · proyectil desde altura"
        };
      }
      if(subtema==="Dinámica y fuerzas"){
        return {
          pregunta:`Un bloque de ${a} kg sobre un plano de ${20+(seed%25)}° está unido por cuerda y polea ideal a una masa colgante de ${b} kg; μ=${(seed%4+1)/10}. Halla aceleración y tensión.`,
          respuesta:`Plantea una ecuación de Newton para cada masa, incluye rozamiento y resuelve el sistema simultáneo.`,
          tema:"Dinámica y fuerzas · sistema acoplado"
        };
      }
      if(subtema==="Trabajo y energía"){
        return {
          pregunta:`Un bloque baja desde altura ${a} m, atraviesa un tramo rugoso de ${b} m con μ=${(seed%4+1)/10} y comprime un resorte k=${c*50} N/m. Halla la compresión máxima.`,
          respuesta:`Usa conservación de energía incluyendo trabajo de fricción: ${texInline(`mgh-W_f=\\frac12kx^2`)}, considerando también el tramo recorrido durante la compresión si aplica.`,
          tema:"Trabajo y energía · energía con roce y resorte"
        };
      }
      if(subtema==="Momento y colisiones"){
        return {
          pregunta:`Choque 2D: una masa ${a} kg con velocidad inicial ${b} m/s en x colisiona con otra en reposo. Tras el choque una sale a ${30+(seed%25)}°. Determina componentes de la otra usando conservación de momento.`,
          respuesta:`Conserva momento en x e y por separado; tendrás dos ecuaciones vectoriales acopladas.`,
          tema:"Momento y colisiones · choque bidimensional"
        };
      }
      if(subtema==="Movimiento circular y rotación"){
        return {
          pregunta:`Un cilindro rueda sin deslizar por un plano desde altura ${a} m. Determina rapidez final y aceleración angular, considerando energía traslacional y rotacional.`,
          respuesta:`Usa ${texInline(`mgh=\\frac12mv^2+\\frac12I\\omega^2`)}, ${texInline(`I=\\frac12mR^2`)}, y ${texInline(`v=\\omega R`) }.`,
          tema:"Movimiento circular y rotación · rodadura"
        };
      }
      if(subtema==="Electricidad y circuitos"){
        return {
          pregunta:`Circuito mixto: una resistencia ${a}Ω está en serie con el paralelo de ${b}Ω y ${c}Ω, alimentado con ${d*12} V. Halla corriente total, corrientes de rama y potencia total.`,
          respuesta:`Primero reduce el paralelo, suma la serie, usa Ohm para corriente total, luego voltaje del paralelo y corrientes de rama.`,
          tema:"Electricidad y circuitos · red mixta"
        };
      }
      if(subtema==="Fluidos"){
        return {
          pregunta:`En una tubería horizontal el diámetro cambia de ${a+5} cm a ${b+3} cm. Si v1=${c} m/s, halla v2 y la diferencia de presión usando continuidad y Bernoulli para agua.`,
          respuesta:`Usa ${texInline(`A_1v_1=A_2v_2`)} y luego ${texInline(`P_1+\\frac12\\rho v_1^2=P_2+\\frac12\\rho v_2^2`) }.`,
          tema:"Fluidos · continuidad y Bernoulli"
        };
      }
      if(subtema==="Oscilaciones"){
        return {
          pregunta:`Una masa-resorte amortiguada obedece ${texInline(`mx''+bx'+kx=0`)} con m=${a}, b=${b}, k=${c*10}. Clasifica el régimen y escribe la forma de la solución.`,
          respuesta:`Compara ${texInline(`b^2`)} con ${texInline(`4mk`)}. Según el discriminante, el sistema es subamortiguado, crítico o sobreamortiguado.`,
          tema:"Oscilaciones · amortiguamiento"
        };
      }
      if(subtema==="Calor y termodinámica"){
        return {
          pregunta:`Un gas ideal sigue un proceso de dos etapas: expansión isobárica y luego compresión isotérmica. Con n=${a%5+1} mol y datos de P,V,T, calcula trabajo neto, ΔU y Q total.`,
          respuesta:`Combina ${texInline(`W=P\\Delta V`)} en la etapa isobárica, ${texInline(`W=nRT\\ln(V_f/V_i)`) } en la isotérmica y primera ley ${texInline(`\\Delta U=Q-W`) }.`,
          tema:"Calor y termodinámica · proceso compuesto"
        };
      }
      if(subtema==="Gravitación"){
        return {
          pregunta:`Un satélite pasa de órbita circular de radio r=${a}R a otra de radio ${b}R alrededor de un planeta. Compara energías orbitales, velocidades y periodo usando leyes de Kepler.`,
          respuesta:`Usa ${texInline(`E=-GMm/(2r)`)} , ${texInline(`v=\\sqrt{GM/r}`)} y ${texInline(`T\\propto r^{3/2}`)}.`,
          tema:"Gravitación · cambio de órbita"
        };
      }
    }

    // ESTADÍSTICA
    if(ramo==="estadistica"){
      if(subtema==="Estadística descriptiva"){
        return {
          pregunta:`Un conjunto tiene media ${a*2}, desviación estándar ${b} y n=${c*10+20}. Al agregar un dato ${d*10}, calcula la nueva media y analiza cómo cambia cualitativamente la varianza.`,
          respuesta:`Nueva media: ${texInline(`\\bar x_{nuevo}=\\frac{n\\bar x+x_{nuevo}}{n+1}`)}. Para la varianza se requiere actualizar la suma de cuadrados.`,
          tema:"Estadística descriptiva · actualización"
        };
      }
      if(subtema==="Probabilidad"){
        return {
          pregunta:`Una población se divide en tres grupos con probabilidades distintas de defecto. Calcula la probabilidad total de defecto y luego la probabilidad posterior del grupo dado que hubo defecto.`,
          respuesta:`Aplica probabilidad total y luego Bayes: ${texInline(`P(G_i|D)=\\frac{P(D|G_i)P(G_i)}{P(D)}`)}.`,
          tema:"Probabilidad · Bayes multinivel"
        };
      }
      if(subtema==="Variables aleatorias"){
        return {
          pregunta:`Sea X discreta con pmf proporcional a ${texInline(`k x^2`)} para x=1,...,${a%5+4}. Encuentra k, E[X] y Var(X).`,
          respuesta:`Normaliza con ${texInline(`k\\sum x^2=1`)}, luego calcula ${texInline(`E[X]=\\sum xp(x)`) } y ${texInline(`Var(X)=E[X^2]-E[X]^2`) }.`,
          tema:"Variables aleatorias · pmf paramétrica"
        };
      }
      if(subtema==="Distribución binomial"){
        return {
          pregunta:`Para X~Bin(${a+20}, ${(seed%5+2)/10}), aproxima ${texInline(`P(${b}<X<${b+8})`)} usando normal con corrección de continuidad.`,
          respuesta:`Usa ${texInline(`\\mu=np,\\ \\sigma=\\sqrt{np(1-p)}`)} y corrige límites a ${texInline(`${b+0.5}`)} y ${texInline(`${b+7.5}`)}.`,
          tema:"Distribución binomial · aproximación normal"
        };
      }
      if(subtema==="Distribución normal"){
        return {
          pregunta:`Si X~N(${a*5},${b}²), determina c tal que ${texInline(`P(|X-\\mu|<c)=0.95`)}.`,
          respuesta:texInline(`c=1.96\\sigma=${fmt(1.96*b)}`),
          tema:"Distribución normal · intervalo central"
        };
      }
      if(subtema==="Inferencia estadística"){
        return {
          pregunta:`Con media muestral ${a*3}, s=${b}, n=${c+20}, construye un IC 95% para μ con σ desconocida y explica cuándo corresponde usar t de Student.`,
          respuesta:`Usa ${texInline(`\\bar x\\pm t_{0.975,n-1}\\frac{s}{\\sqrt n}`)}; t corresponde cuando σ poblacional es desconocida.`,
          tema:"Inferencia estadística · t de Student"
        };
      }
      if(subtema==="Correlación y regresión"){
        return {
          pregunta:`Dado r=${((seed%17)-8)/10}, n=${a+20}, analiza significancia de correlación usando ${texInline(`t=r\\sqrt{\\frac{n-2}{1-r^2}}`)} y explica por qué correlación no implica causalidad.`,
          respuesta:`Calcula t y compáralo con una t con n−2 grados de libertad. La significancia estadística no demuestra causalidad.`,
          tema:"Correlación y regresión · prueba de significancia"
        };
      }
    }

    // PROGRAMACIÓN
    if(ramo==="programacion"){
      if(subtema==="Variables y operadores"){
        return {
          pregunta:`Predice salida y tipos finales:<pre><code>a=${a}\nb=${b}\nc=(a**2 + b//2) % 7\nx=(c > 3) and (a/b > 1)\nprint(c, x, type(c).__name__, type(x).__name__)</code></pre>`,
          respuesta:`Debes evaluar precedencia, división entera, módulo, comparación y operadores booleanos.`,
          tema:"Variables y operadores · precedencia completa"
        };
      }
      if(subtema==="Condicionales"){
        return {
          pregunta:`Determina exactamente qué imprime un bloque con if/elif anidados, operadores and/or/not y comparaciones encadenadas para a=${a}, b=${b}, c=${c}.`,
          respuesta:`Evalúa primero cada condición booleana respetando cortocircuito y orden de los elif.`,
          tema:"Condicionales · lógica anidada"
        };
      }
      if(subtema==="Bucles"){
        return {
          pregunta:`Analiza salida y complejidad:<pre><code>s=0\nfor i in range(1, ${a+12}):\n    for j in range(i):\n        for k in range(j):\n            if (i+j+k)%3==0:\n                s += i-j+k\nprint(s)</code></pre>`,
          respuesta:`La complejidad temporal dominante es O(n³). La salida exacta requiere seguir las tres capas o derivar sumas.`,
          tema:"Bucles · triple anidación"
        };
      }
      if(subtema==="Listas y comprensiones"){
        return {
          pregunta:`Evalúa:<pre><code>[(i,j,i*j) for i in range(1,${a+5}) for j in range(1,i) if (i+j)%2==0 and (i*j)%3!=0]</code></pre>`,
          respuesta:`Debes recorrer ambos for en el mismo orden de una comprensión y aplicar ambas condiciones antes de construir cada tupla.`,
          tema:"Listas y comprensiones · doble filtro"
        };
      }
      if(subtema==="Diccionarios"){
        return {
          pregunta:`Dado un diccionario anidado de cursos→alumnos→notas, escribe código que obtenga el promedio por alumno y devuelva solo quienes superan 5.0, ordenados de mayor a menor.`,
          respuesta:`Combina iteración sobre dict.items(), comprensión, sum/len y sorted con key.`,
          tema:"Diccionarios · estructura anidada"
        };
      }
      if(subtema==="Funciones"){
        return {
          pregunta:`Escribe una función recursiva con memoización que calcule el número de formas de subir n escalones avanzando 1, 2 o 3 pasos.`,
          respuesta:`Define recurrencia ${texInline(`f(n)=f(n-1)+f(n-2)+f(n-3)`)} con casos base y cache.`,
          tema:"Funciones · recursión y memoización"
        };
      }
      if(subtema==="Archivos y JSON"){
        return {
          pregunta:`Escribe un programa que lea varios archivos JSON de sensores, ignore registros corruptos, agrupe por máquina y exporte un resumen con promedio, máximo y cantidad válida.`,
          respuesta:`Requiere json.load, manejo de excepciones, diccionarios acumuladores y json.dump.`,
          tema:"Archivos y JSON · procesamiento robusto"
        };
      }
      if(subtema==="Excepciones"){
        return {
          pregunta:`Diseña una función que lea un JSON, valide claves obligatorias, convierta tipos y maneje FileNotFoundError, JSONDecodeError, KeyError y ValueError con mensajes distintos.`,
          respuesta:`Usa múltiples except específicos y evita un except genérico salvo como último recurso.`,
          tema:"Excepciones · manejo múltiple"
        };
      }
      if(subtema==="Programación orientada a objetos"){
        return {
          pregunta:`Diseña clases abstractas Maquina y dos subclases con polimorfismo, propiedades validadas, método de costo horario y serialización JSON.`,
          respuesta:`Nivel extremo: combina herencia, ABC, @property, sobrescritura de métodos y conversión a diccionario serializable.`,
          tema:"Programación orientada a objetos · diseño completo"
        };
      }
    }

    return null;
  }

  function generatorFor(ramo){
    return {
      calculo_diferencial:calcDiff,
      algebra_lineal:algebraLineal,
      calculo_basico:(s,n,st)=>basico(s,n,st,"calculo_basico"),
      algebra_basica:(s,n,st)=>basico(s,n,st,"algebra_basica"),
      quimica_general:quimica,
      calculo_multivariable:multivariable,
      fisica:fisica,
      estadistica:estadistica,
      programacion:programacion
    }[ramo];
  }

  function seedPorNivel(idx,nivel){
    const lv = nivel==="aplicados" ? 7 : Number(nivel)||1;
    return idx + (lv-1)*113;
  }


  function marcarVariante(e,idx){
    if(!e) return e;
    const n=(idx%TOTAL)+1;
    e.pregunta = e.pregunta + `<span class="bank-variant"> · variante ${n}/100</span>`;
    return e;
  }

  function generar(ramo,nivel,subtema){
    const gen=generatorFor(ramo);
    if(!gen || !subtema || subtema==="todos") return null;
    const idx=nextIndex(ramo,nivel,subtema);
    let e = nivelNum(nivel)===6 ? sellarExtremo(nivel6Extremo(ramo,subtema,seedPorNivel(idx,nivel)),seedPorNivel(idx,nivel)) : null;
    if(!e) e=gen(seedPorNivel(idx,nivel),nivel,subtema);
    if(!e) return null;
    if(nivel==="aplicados") e=envolverAplicado(ramo,subtema,e,seedPorNivel(idx,nivel));
    e=marcarDificultad(e,nivel);
    e=marcarVariante(e,idx);
    e.subtema=subtema;
    e._banco100=true;
    e._indiceBanco=idx+1;
    e._totalBanco=TOTAL;
    e.nivel=nivel;
    if(!e.tema) e.tema=subtema;
    if(!e.subtema && (ramo==="quimica_general")) e.subtema=subtema;
    return e;
  }


  function subtemasPorCurso(ramo){
    return {
      calculo_diferencial:["Derivadas","Exponenciales","Regla de la cadena","Derivación implícita","Tasas de cambio","Integrales indefinidas","Integrales definidas","Sustitución","Integración por partes"],
      algebra_lineal:["Matrices y operaciones","Determinantes","Inversas","Sistemas lineales","Vectores y espacios","Valores propios","Diagonalización"],
      calculo_basico:["Ecuaciones","Potencias y radicales","Exponenciales y logaritmos","Trigonometría","Dominio","Inecuaciones"],
      algebra_basica:["Factorización","Productos notables","Fracciones algebraicas","Polinomios","Valor absoluto","Inecuaciones","Sistemas"],
      quimica_general:["Configuración electrónica","Electronegatividad","Fuerzas intermoleculares","Balanceo","Polaridad y geometría"],
      calculo_multivariable:["Derivadas parciales","Gradiente y derivada direccional","Plano tangente y linealización","Hessiano y extremos","Integrales dobles y triples","Cambio de variables y polares","Multiplicadores de Lagrange"],
      fisica:["Cinemática","Dinámica y fuerzas","Trabajo y energía","Momento y colisiones","Movimiento circular y rotación","Electricidad y circuitos","Fluidos","Oscilaciones","Calor y termodinámica","Gravitación"],
      estadistica:["Estadística descriptiva","Probabilidad","Variables aleatorias","Distribución binomial","Distribución normal","Inferencia estadística","Correlación y regresión"],
      programacion:["Variables y operadores","Condicionales","Bucles","Listas y comprensiones","Diccionarios","Funciones","Archivos y JSON","Excepciones","Programación orientada a objetos"]
    }[ramo] || [];
  }

  function generarTodos(ramo,nivel){
    const subs=subtemasPorCurso(ramo);
    if(!subs.length) return null;
    const k=`TODOS::${ramo}::${nivel}`;
    let s=state.get(k);
    if(!s){
      const orden=[];
      for(let vuelta=0;vuelta<100;vuelta++){
        for(let j=0;j<subs.length;j++){
          orden.push({subtema:subs[j],idx:(vuelta*17+j*13)%100});
        }
      }
      for(let i=orden.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [orden[i],orden[j]]=[orden[j],orden[i]];
      }
      s={orden,pos:0};
      state.set(k,s);
    }
    if(s.pos>=s.orden.length) s.pos=0;
    const item=s.orden[s.pos++];
    return generarIndice(ramo,nivel,item.subtema,item.idx);
  }

  function generarIndice(ramo,nivel,subtema,idx){
    const gen=generatorFor(ramo);
    if(!gen || !subtema || subtema==="todos") return null;
    let e = nivelNum(nivel)===6 ? sellarExtremo(nivel6Extremo(ramo,subtema,seedPorNivel(idx%TOTAL,nivel)),seedPorNivel(idx%TOTAL,nivel)) : null;
    if(!e) e=gen(seedPorNivel(idx%TOTAL,nivel),nivel,subtema);
    if(!e) return null;
    if(nivel==="aplicados") e=envolverAplicado(ramo,subtema,e,seedPorNivel(idx%TOTAL,nivel));
    e=marcarDificultad(e,nivel);
    e=marcarVariante(e,idx%TOTAL);
    e.subtema=subtema;
    e._banco100=true;
    e._indiceBanco=(idx%TOTAL)+1;
    e._totalBanco=TOTAL;
    e.nivel=nivel;
    if(!e.tema) e.tema=subtema;
    if(!e.subtema && ramo==="quimica_general") e.subtema=subtema;
    return e;
  }

  function contar(ramo,nivel,subtema){
    const gen=generatorFor(ramo);
    if(!gen || !subtema || subtema==="todos") return 0;
    let n=0;
    for(let i=0;i<TOTAL;i++){
      const seed=seedPorNivel(i,nivel);
      const e=(nivelNum(nivel)===6 ? sellarExtremo(nivel6Extremo(ramo,subtema,seed),seed) : null) || gen(seed,nivel,subtema);
      if(e && e.pregunta) n++;
    }
    return n;
  }

  function contarUnicos(ramo,nivel,subtema){
    const gen=generatorFor(ramo);
    if(!gen || !subtema || subtema==="todos") return 0;
    const firmas=new Set();
    for(let i=0;i<TOTAL;i++){
      const seed=seedPorNivel(i,nivel);
      let e=(nivelNum(nivel)===6 ? sellarExtremo(nivel6Extremo(ramo,subtema,seed),seed) : null) || gen(seed,nivel,subtema);
      if(!e) continue;
      e=marcarVariante(e,i);
      firmas.add(String(e.pregunta).replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim());
    }
    return firmas.size;
  }

  return {TOTAL,generar,generarIndice,generarTodos,contar,contarUnicos};
})();
