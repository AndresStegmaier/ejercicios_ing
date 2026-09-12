# Generador de Ejercicios

## Inicio rápido
La aplicación usa `fetch()` para cargar los archivos JSON, por lo que se recomienda abrirla con un servidor local y no haciendo doble clic en `index.html`.

### Opción Python
En la carpeta del proyecto:
```bash
python -m http.server 8000
```
Luego abre:
http://localhost:8000

## Estructura
- `index.html`: interfaz
- `style.css`: diseño
- `script.js`: lógica principal
- `js/generadores.js`: generadores matemáticos
- `ejercicios/*.json`: bancos independientes por ramo

Los niveles son 1 a 4. Los ejercicios matemáticos mezclan banco JSON con generadores aleatorios para aumentar mucho la cantidad de combinaciones.
