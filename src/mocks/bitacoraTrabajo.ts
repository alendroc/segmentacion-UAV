/** Etapas y bitacora del trabajo de inferencia simulado. */
import type { EntradaBitacora, ParametrosInferencia } from "../shared/api/types";

/** Cuanto tarda el trabajo simulado, de principio a fin. */
export const DURACION_MS = 40_000;

interface Etapa {
  /** Fraccion de avance en la que empieza. */
  desde: number;
  nombre: string;
}

const ETAPAS: Etapa[] = [
  { desde: 0, nombre: "Leyendo la imagen" },
  { desde: 0.08, nombre: "Recortando en mosaicos" },
  { desde: 0.18, nombre: "Ejecutando la deteccion sobre los mosaicos" },
  { desde: 0.8, nombre: "Uniendo poligonos partidos en los bordes" },
  { desde: 0.92, nombre: "Calculando area, diametro y centroide" },
];

export interface Almacenado {
  id: string;
  proyectoId: string;
  ortomosaicoId: string;
  parametros: ParametrosInferencia;
  iniciadoEnMs: number;
  mosaicosTotales: number;
  copasAlTerminar: number;
  canceladoEnMs: number | null;
}

export function etapaDe(fraccion: number): string {
  let nombre = ETAPAS[0].nombre;
  for (const etapa of ETAPAS) if (fraccion >= etapa.desde) nombre = etapa.nombre;
  return nombre;
}

export function marca(inicioMs: number, fraccion: number): string {
  return new Date(inicioMs + fraccion * DURACION_MS).toISOString();
}

export function bitacoraDe(t: Almacenado, fraccion: number): EntradaBitacora[] {
  const entradas: [number, EntradaBitacora][] = [
    [
      0,
      {
        momento: marca(t.iniciadoEnMs, 0),
        nivel: "info",
        mensaje: `Trabajo ${t.id} en cola.`,
      },
    ],
    [
      0.08,
      {
        momento: marca(t.iniciadoEnMs, 0.08),
        nivel: "info",
        mensaje: "Imagen leida y georreferenciacion validada.",
      },
    ],
    [
      0.18,
      {
        momento: marca(t.iniciadoEnMs, 0.18),
        nivel: "info",
        mensaje: `Recorte en ${t.mosaicosTotales} mosaicos de ${t.parametros.tamanoMosaicoPx} px, con ${t.parametros.traslapePct} % de traslape.`,
      },
    ],
    [
      0.2,
      {
        momento: marca(t.iniciadoEnMs, 0.2),
        nivel: "advertencia",
        mensaje:
          "No hay modelo entrenado: el avance y el resultado son simulados.",
      },
    ],
    [
      0.8,
      {
        momento: marca(t.iniciadoEnMs, 0.8),
        nivel: "info",
        mensaje:
          "Deteccion terminada. Uniendo poligonos partidos por el traslape.",
      },
    ],
    [
      0.92,
      {
        momento: marca(t.iniciadoEnMs, 0.92),
        nivel: "info",
        mensaje: "Calculando area, diametro y centroide en EPSG:5367.",
      },
    ],
    [
      1,
      {
        momento: marca(t.iniciadoEnMs, 1),
        nivel: "info",
        mensaje: `${t.copasAlTerminar} copas detectadas.`,
      },
    ],
  ];

  const hasta = entradas
    .filter(([umbral]) => fraccion >= umbral)
    .map(([, entrada]) => entrada);

  if (t.canceladoEnMs !== null) {
    hasta.push({
      momento: new Date(t.canceladoEnMs).toISOString(),
      nivel: "advertencia",
      mensaje: "Trabajo cancelado por la persona usuaria.",
    });
  }
  return hasta;
}
