/** Generador pseudoaleatorio con semilla y utilidades numericas del generador. */
/* ------------------------------------------------------------------ */
/* PRNG                                                                */
/* ------------------------------------------------------------------ */

/** mulberry32: 32 bits de estado, rapido y con periodo mas que suficiente. */
export function crearAzar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function entre(azar: () => number, min: number, max: number): number {
  return min + azar() * (max - min);
}

export function enteroEntre(azar: () => number, min: number, max: number): number {
  return Math.floor(entre(azar, min, max + 1));
}

/** Redondeo estable. Evita que el formateo de flotantes rompa el byte a byte. */
export function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
