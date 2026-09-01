/**
 * Preferencia de movimiento reducido, leida en un solo lugar
 * (CLAUDE.md, seccion 6 bis). Toda animacion de la aplicacion la consulta.
 */
import { useReducedMotion } from "motion/react";

export function useMovimientoReducido(): boolean {
  return useReducedMotion() ?? false;
}
