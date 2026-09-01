import type { Copa } from "@/api/types";

/**
 * Debajo de este valor la deteccion se marca como de confianza baja.
 * El generador sintetico separa las dos poblaciones en 0.62 y 0.72, asi que
 * 0.70 las distingue sin ambiguedad.
 */
export const UMBRAL_CONFIANZA_BAJA = 0.7;

export type EstadoCopa =
  | "automatica"
  | "confianza-baja"
  | "manual"
  | "corregida"
  | "eliminada";

export function estadoDeCopa(copa: Copa): EstadoCopa {
  if (copa.eliminada) return "eliminada";
  if (copa.origen === "manual") return "manual";
  if (copa.origen === "corregido") return "corregida";
  if (copa.confianza !== null && copa.confianza < UMBRAL_CONFIANZA_BAJA) {
    return "confianza-baja";
  }
  return "automatica";
}

interface Apariencia {
  /** Nombre del token de color, sin el prefijo `--`. */
  token: string;
  etiqueta: string;
  /** El trazo discontinuo evita depender solo del color (CLAUDE.md §6 ter). */
  discontinuo: boolean;
  opacidad: number;
}

export const APARIENCIAS: Record<EstadoCopa, Apariencia> = {
  automatica: {
    token: "copa-automatica",
    etiqueta: "Automatica",
    discontinuo: false,
    opacidad: 1,
  },
  "confianza-baja": {
    token: "copa-confianza-baja",
    etiqueta: "Confianza baja",
    discontinuo: true,
    opacidad: 1,
  },
  manual: {
    token: "copa-manual",
    etiqueta: "Agregada a mano",
    discontinuo: false,
    opacidad: 1,
  },
  corregida: {
    token: "copa-corregida",
    etiqueta: "Corregida",
    discontinuo: false,
    opacidad: 1,
  },
  eliminada: {
    token: "copa-eliminada",
    etiqueta: "Descartada",
    discontinuo: true,
    opacidad: 0.45,
  },
};

export function aparienciaDeCopa(copa: Copa): Apariencia {
  return APARIENCIAS[estadoDeCopa(copa)];
}
