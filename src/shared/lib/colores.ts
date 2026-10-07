/**
 * Puente entre los tokens de color del tema y el lienzo del mapa.
 *
 * Los colores viven en `src/index.css` y no se duplican aqui (CLAUDE.md §6 ter).
 * OpenLayers pinta sobre canvas, que en algunos navegadores todavia no acepta
 * `oklch()`, asi que se resuelven a `rgb()` dejando que el propio navegador haga
 * la conversion.
 */

const cache = new Map<string, string>();

/** Resuelve cualquier color CSS a la cadena `rgb(...)` equivalente. */
export function resolverColor(color: string): string {
  const guardado = cache.get(color);
  if (guardado) return guardado;

  const sonda = document.createElement("span");
  sonda.style.color = color;
  sonda.style.display = "none";
  document.body.appendChild(sonda);
  const resuelto = getComputedStyle(sonda).color || color;
  sonda.remove();

  cache.set(color, resuelto);
  return resuelto;
}

/** Valor de un token del tema, ya resuelto. Ej.: `tokenColor("copa-manual")`. */
export function tokenColor(nombre: string): string {
  const bruto = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${nombre}`)
    .trim();
  return bruto ? resolverColor(bruto) : "rgb(128,128,128)";
}

/** Igual que `tokenColor`, con transparencia. */
export function tokenColorAlpha(nombre: string, alpha: number): string {
  const rgb = tokenColor(nombre);
  const n = rgb.match(/[\d.]+/g);
  if (!n || n.length < 3) return rgb;
  return `rgba(${n[0]}, ${n[1]}, ${n[2]}, ${alpha})`;
}
