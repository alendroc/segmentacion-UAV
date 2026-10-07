/**
 * Formateo de numeros, fechas y coordenadas.
 * Los textos visibles van en espanol de Costa Rica (CLAUDE.md, seccion 6).
 */

const LOCALE = "es-CR";

function formateador(opciones: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALE, opciones);
}

const ENTERO = formateador({ maximumFractionDigits: 0 });
const DOS_DECIMALES = formateador({
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PORCENTAJE = formateador({
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const FECHA = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatearEntero(valor: number): string {
  return ENTERO.format(valor);
}

/** Area de copa en metros cuadrados, p. ej. "12,45 m²". */
export function formatearArea(m2: number): string {
  return `${DOS_DECIMALES.format(m2)} m²`;
}

/** Longitud en metros, p. ej. "3,90 m". */
export function formatearMetros(m: number): string {
  return `${DOS_DECIMALES.format(m)} m`;
}

export function formatearHectareas(ha: number): string {
  return `${DOS_DECIMALES.format(ha)} ha`;
}

/** Confianza del modelo. null cuando el origen no es automatico. */
export function formatearConfianza(valor: number | null): string {
  return valor === null ? "No aplica" : PORCENTAJE.format(valor);
}

/**
 * Coordenada CRTM05 en metros. EPSG:5367 no usa grados: mostrarlos como tales
 * seria un error de lectura para quien verifique en campo.
 */
export function formatearCoordenada([x, y]: readonly [
  number,
  number,
]): string {
  return `${ENTERO.format(x)} E, ${ENTERO.format(y)} N`;
}

export function formatearFecha(iso: string): string {
  return FECHA.format(new Date(iso));
}

/** Tamano de archivo legible. El ortomosaico real ronda 1,6 GB. */
export function formatearBytes(bytes: number): string {
  const unidades = ["B", "KB", "MB", "GB", "TB"] as const;
  let valor = bytes;
  let indice = 0;
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }
  const decimales = indice === 0 ? ENTERO : DOS_DECIMALES;
  return `${decimales.format(valor)} ${unidades[indice]}`;
}
