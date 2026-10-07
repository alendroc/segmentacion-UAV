import type { Copa } from "@/shared/api/types";

/**
 * Filtros y metricas agregadas (RF-16, RF-18).
 *
 * Funciones puras, sin React y sin peticiones: los filtros **ocultan**, no
 * borran, y el recalculo ocurre en el cliente sobre los datos ya descargados
 * (CLAUDE.md §5). Mover un deslizador nunca vuelve a pedir nada al servidor.
 */

export interface Filtros {
  /** 0 a 1. */
  confianzaMinima: number;
  /** En metros cuadrados. */
  areaMinima: number;
}

export const FILTROS_INICIALES: Filtros = {
  confianzaMinima: 0,
  areaMinima: 0,
};

export function sonFiltrosIniciales(filtros: Filtros): boolean {
  return (
    filtros.confianzaMinima === FILTROS_INICIALES.confianzaMinima &&
    filtros.areaMinima === FILTROS_INICIALES.areaMinima
  );
}

/**
 * Una copa eliminada nunca es visible: es borrado logico, no un filtro.
 *
 * Una copa sin confianza —trazada o corregida a mano— **no se oculta nunca por
 * el filtro de confianza**. El umbral mide al modelo, y sobre esas copas el
 * modelo no opino: descartarlas por no tener nota seria castigar precisamente
 * el trabajo de correccion.
 */
export function copaVisible(copa: Copa, filtros: Filtros): boolean {
  if (copa.eliminada) return false;
  if (copa.areaM2 < filtros.areaMinima) return false;
  if (copa.confianza !== null && copa.confianza < filtros.confianzaMinima) {
    return false;
  }
  return true;
}

export function filtrarCopas(copas: Copa[], filtros: Filtros): Copa[] {
  return copas.filter((copa) => copaVisible(copa, filtros));
}

export interface Metricas {
  /** Copas visibles con los filtros actuales. */
  conteo: number;
  /** Copas ocultas por los filtros. No incluye las eliminadas. */
  ocultas: number;
  /** Copas con borrado logico. */
  eliminadas: number;
  densidadPorHa: number;
  areaMediaM2: number;
  diametroMedioM: number;
  areaCopaTotalM2: number;
}

/**
 * @param copas Todas las copas del proyecto, sin filtrar.
 * @param filtros Umbrales activos.
 * @param areaHa Superficie del area de interes. Denominador de la densidad.
 */
export function calcularMetricas(
  copas: Copa[],
  filtros: Filtros,
  areaHa: number,
): Metricas {
  const visibles = filtrarCopas(copas, filtros);
  const eliminadas = copas.filter((c) => c.eliminada).length;

  const areaCopaTotalM2 = visibles.reduce((s, c) => s + c.areaM2, 0);
  const diametroTotal = visibles.reduce((s, c) => s + c.diametroM, 0);

  return {
    conteo: visibles.length,
    ocultas: copas.length - eliminadas - visibles.length,
    eliminadas,
    densidadPorHa: areaHa > 0 ? visibles.length / areaHa : 0,
    areaMediaM2: visibles.length ? areaCopaTotalM2 / visibles.length : 0,
    diametroMedioM: visibles.length ? diametroTotal / visibles.length : 0,
    areaCopaTotalM2,
  };
}
