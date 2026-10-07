/**
 * Generacion sintetica de copas, reproducible.
 *
 * Sin `Math.random()`. La misma semilla produce siempre exactamente las mismas
 * copas: los fixtures sirven tambien como datos de prueba automatizada
 * (PLAN.md, Fase 2).
 *
 * Corre en dos entornos: el navegador y `scripts/generar-fixtures.ts` bajo Node
 * plano. Por eso solo importa `lib/geometriaPlana.ts`, que no tiene
 * dependencias, y el tipo `Copa`, que se borra al compilar.
 */
import {
  areaAnilloM2,
  centroideAnillo,
  diametroEquivalenteM,
  type Posicion,
} from "../shared/lib/geometriaPlana.ts";
import type { Copa } from "../shared/api/types.ts";
import { crearAzar, entre, enteroEntre, redondear } from "./azar.ts";

export { crearAzar };

/** Semilla del levantamiento simulado. Cambiarla cambia todos los fixtures. */
export const SEMILLA = 20260415;

/**
 * Area de interes de 120 m x 100 m = 1.2 ha, en EPSG:5367.
 * El centro reproyecta a ~10.148 N, -85.452 O: Nicoya, Guanacaste.
 */
export const AREA_INTERES = {
  minX: 340_840,
  minY: 1_122_050,
  maxX: 340_960,
  maxY: 1_122_150,
} as const;

/** Copa tal como sale del generador. El proyecto lo asigna quien la sirve. */
export type CopaSintetica = Omit<Copa, "proyectoId">;

export interface Claro {
  centro: Posicion;
  radio: number;
}

export interface ResultadoGenerador {
  copas: CopaSintetica[];
  claros: Claro[];
  areaInteres: typeof AREA_INTERES;
  areaHa: number;
}

/* ------------------------------------------------------------------ */
/* Parametros del dosel                                                */
/* ------------------------------------------------------------------ */

const RADIO_MIN = 1.8;
const RADIO_MAX = 4.2;
const VERTICES_MIN = 11;
const VERTICES_MAX = 16;
/** Proporcion exacta de detecciones en la cola de confianza baja. */
const PROPORCION_CONFIANZA_BAJA = 0.175;
const DECIMALES_COORDENADA = 3;

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

/**
 * Contorno irregular de una copa.
 *
 * Los angulos avanzan siempre hacia adelante (el temblor es menor que medio
 * paso) y los radios son positivos: eso basta para garantizar que el poligono
 * no se autointersecte, sin necesidad de comprobarlo despues.
 */
function contornoDeCopa(
  azar: () => number,
  centro: Posicion,
  radioBase: number,
): Posicion[] {
  const n = enteroEntre(azar, VERTICES_MIN, VERTICES_MAX);
  const paso = (2 * Math.PI) / n;
  const anillo: Posicion[] = [];

  for (let i = 0; i < n; i += 1) {
    const angulo = i * paso + entre(azar, -0.35, 0.35) * paso;
    const radio = limitar(
      radioBase * entre(azar, 0.82, 1.18),
      RADIO_MIN,
      RADIO_MAX,
    );
    anillo.push([
      redondear(centro[0] + Math.cos(angulo) * radio, DECIMALES_COORDENADA),
      redondear(centro[1] + Math.sin(angulo) * radio, DECIMALES_COORDENADA),
    ]);
  }

  anillo.push([anillo[0][0], anillo[0][1]]); // cierre
  return anillo;
}

/**
 * Claros del dosel. El bosque tropical seco tiene dosel abierto y
 * discontinuo: sin estos huecos el resultado seria una nube uniforme, que es
 * justo lo que diferencia este caso de la selva humeda (CLAUDE.md seccion 9).
 */
function generarClaros(azar: () => number): Claro[] {
  const cantidad = enteroEntre(azar, 4, 6);
  const claros: Claro[] = [];
  for (let i = 0; i < cantidad; i += 1) {
    claros.push({
      centro: [
        entre(azar, AREA_INTERES.minX + 10, AREA_INTERES.maxX - 10),
        entre(azar, AREA_INTERES.minY + 10, AREA_INTERES.maxY - 10),
      ],
      radio: entre(azar, 8, 14),
    });
  }
  return claros;
}

function dentroDeAlgunClaro(claros: Claro[], punto: Posicion): boolean {
  return claros.some((claro) => {
    const dx = punto[0] - claro.centro[0];
    const dy = punto[1] - claro.centro[1];
    return dx * dx + dy * dy < claro.radio * claro.radio;
  });
}

/* ------------------------------------------------------------------ */
/* Generacion                                                          */
/* ------------------------------------------------------------------ */

interface SemillaCopa {
  centro: Posicion;
  radio: number;
}

export function generar(semilla: number = SEMILLA): ResultadoGenerador {
  const azar = crearAzar(semilla);
  const claros = generarClaros(azar);
  const objetivo = enteroEntre(azar, 120, 180);

  const semillas: SemillaCopa[] = [];

  // Muestreo por rechazo: nada de reticula.
  const INTENTOS_MAXIMOS = 40_000;
  for (
    let intento = 0;
    intento < INTENTOS_MAXIMOS && semillas.length < objetivo;
    intento += 1
  ) {
    const radio = entre(azar, 2.0, 4.0);
    const centro: Posicion = [
      entre(azar, AREA_INTERES.minX + radio, AREA_INTERES.maxX - radio),
      entre(azar, AREA_INTERES.minY + radio, AREA_INTERES.maxY - radio),
    ];

    if (dentroDeAlgunClaro(claros, centro)) continue;

    const chocaConOtra = semillas.some((otra) => {
      const dx = centro[0] - otra.centro[0];
      const dy = centro[1] - otra.centro[1];
      const minima = (radio + otra.radio) * 0.9;
      return dx * dx + dy * dy < minima * minima;
    });
    if (chocaConOtra) continue;

    semillas.push({ centro, radio });
  }

  // Orden estable por posicion, para que los identificadores no dependan del
  // orden en que el muestreo acepto cada copa.
  semillas.sort(
    (a, b) => a.centro[1] - b.centro[1] || a.centro[0] - b.centro[0],
  );

  // La cola de confianza baja se asigna por construccion, no por sorteo: asi la
  // proporcion es exacta y no depende de la varianza del muestreo.
  const cantidadBaja = Math.round(semillas.length * PROPORCION_CONFIANZA_BAJA);
  const indices = semillas.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  const esConfianzaBaja = new Set(indices.slice(0, cantidadBaja));

  const copas: CopaSintetica[] = semillas.map((semillaCopa, i) => {
    const anillo = contornoDeCopa(azar, semillaCopa.centro, semillaCopa.radio);

    // El area y el centroide se calculan DESPUES de redondear las coordenadas,
    // para que coincidan exactamente con la geometria que se escribe al archivo.
    const areaM2 = redondear(areaAnilloM2(anillo), 3);
    const centro = centroideAnillo(anillo);

    const confianza = esConfianzaBaja.has(i)
      ? entre(azar, 0.3, 0.62)
      : 0.72 + azar() ** 0.6 * 0.27;

    return {
      id: "co-" + String(i + 1).padStart(3, "0"),
      geometria: { type: "Polygon", coordinates: [anillo] },
      confianza: redondear(confianza, 4),
      areaM2,
      diametroM: redondear(diametroEquivalenteM(areaM2), 3),
      centroide: [
        redondear(centro[0], DECIMALES_COORDENADA),
        redondear(centro[1], DECIMALES_COORDENADA),
      ],
      origen: "automatico",
      eliminada: false,
    };
  });

  const anchoM = AREA_INTERES.maxX - AREA_INTERES.minX;
  const altoM = AREA_INTERES.maxY - AREA_INTERES.minY;

  return {
    copas,
    claros,
    areaInteres: AREA_INTERES,
    areaHa: redondear((anchoM * altoM) / 10_000, 4),
  };
}

/** Anillo del area de interes, en sentido antihorario. */
export function anilloAreaInteres(): Posicion[] {
  const { minX, minY, maxX, maxY } = AREA_INTERES;
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
    [minX, minY],
  ];
}

/** Radios permitidos, expuestos para que las pruebas no los dupliquen. */
export const LIMITES = {
  RADIO_MIN,
  RADIO_MAX,
  VERTICES_MIN,
  VERTICES_MAX,
  PROPORCION_CONFIANZA_BAJA,
} as const;
