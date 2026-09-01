/**
 * Trabajos de inferencia simulados (RF-06 a RF-12).
 *
 * El progreso se **deriva del tiempo transcurrido** en cada consulta, en vez de
 * avanzarse con un temporizador. Asi el mock no tiene relojes propios que
 * limpiar, el resultado es el mismo se consulte cuando se consulte, y las
 * pruebas pueden fijar el instante sin esperar de verdad.
 *
 * No hay ningun modelo detras. Lo unico que se simula es la forma de la
 * respuesta y su avance en el tiempo.
 */
import type {
  EntradaBitacora,
  ParametrosInferencia,
  TrabajoInferencia,
} from "../api/types";

/** Cuanto tarda el trabajo simulado, de principio a fin. */
export const DURACION_MS = 40_000;

interface Etapa {
  /** Fraccion de avance en la que empieza. */
  desde: number;
  nombre: string;
}

const ETAPAS: Etapa[] = [
  { desde: 0, nombre: "Leyendo el ortomosaico" },
  { desde: 0.08, nombre: "Recortando en mosaicos" },
  { desde: 0.18, nombre: "Ejecutando la deteccion sobre los mosaicos" },
  { desde: 0.8, nombre: "Uniendo poligonos partidos en los bordes" },
  { desde: 0.92, nombre: "Calculando area, diametro y centroide" },
];

interface Almacenado {
  id: string;
  proyectoId: string;
  ortomosaicoId: string;
  parametros: ParametrosInferencia;
  iniciadoEnMs: number;
  mosaicosTotales: number;
  copasAlTerminar: number;
  canceladoEnMs: number | null;
}

let trabajos: Almacenado[] = [];

export function reiniciarTrabajos(): void {
  trabajos = [];
}

/**
 * Cuantos mosaicos hacen falta para cubrir la imagen con el traslape pedido.
 * Sale de numeros reales, no de un valor inventado: por eso la pantalla puede
 * explicar de donde viene.
 */
export function contarMosaicos(
  anchoPx: number,
  altoPx: number,
  { tamanoMosaicoPx, traslapePct }: ParametrosInferencia,
): number {
  const paso = tamanoMosaicoPx * (1 - traslapePct / 100);
  if (paso <= 0) return 0;
  const columnas = Math.max(
    1,
    Math.ceil((anchoPx - tamanoMosaicoPx) / paso) + 1,
  );
  const filas = Math.max(1, Math.ceil((altoPx - tamanoMosaicoPx) / paso) + 1);
  return columnas * filas;
}

function etapaDe(fraccion: number): string {
  let nombre = ETAPAS[0].nombre;
  for (const etapa of ETAPAS) if (fraccion >= etapa.desde) nombre = etapa.nombre;
  return nombre;
}

function marca(inicioMs: number, fraccion: number): string {
  return new Date(inicioMs + fraccion * DURACION_MS).toISOString();
}

function bitacoraDe(t: Almacenado, fraccion: number): EntradaBitacora[] {
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
        mensaje: "Ortomosaico leido y georreferenciacion validada.",
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

function proyectar(t: Almacenado, ahoraMs: number): TrabajoInferencia {
  const finMs = t.canceladoEnMs ?? ahoraMs;
  const fraccion = Math.min(1, Math.max(0, (finMs - t.iniciadoEnMs) / DURACION_MS));

  const cancelado = t.canceladoEnMs !== null;
  const completado = !cancelado && fraccion >= 1;

  const estado = cancelado
    ? "cancelado"
    : completado
      ? "completado"
      : fraccion > 0
        ? "ejecutando"
        : "en_cola";

  return {
    id: t.id,
    proyectoId: t.proyectoId,
    ortomosaicoId: t.ortomosaicoId,
    estado,
    progreso: Math.round(fraccion * 100),
    etapa: cancelado
      ? "Cancelado"
      : completado
        ? "Terminado"
        : etapaDe(fraccion),
    // La inferencia ocupa de 0.18 a 0.80 del avance total.
    mosaicoActual: Math.min(
      t.mosaicosTotales,
      Math.max(0, Math.round(((fraccion - 0.18) / 0.62) * t.mosaicosTotales)),
    ),
    mosaicosTotales: t.mosaicosTotales,
    parametros: t.parametros,
    iniciadoEn: new Date(t.iniciadoEnMs).toISOString(),
    finalizadoEn: completado
      ? marca(t.iniciadoEnMs, 1)
      : cancelado
        ? new Date(t.canceladoEnMs as number).toISOString()
        : null,
    copasDetectadas: completado ? t.copasAlTerminar : null,
    bitacora: bitacoraDe(t, fraccion),
  };
}

export function crearTrabajo(datos: {
  proyectoId: string;
  ortomosaicoId: string;
  parametros: ParametrosInferencia;
  mosaicosTotales: number;
  copasAlTerminar: number;
}): TrabajoInferencia {
  const almacenado: Almacenado = {
    id: `tr-${Date.now().toString(36)}`,
    iniciadoEnMs: Date.now(),
    canceladoEnMs: null,
    ...datos,
  };
  trabajos.unshift(almacenado);
  return proyectar(almacenado, Date.now());
}

export function obtenerTrabajo(trabajoId: string): TrabajoInferencia | null {
  const t = trabajos.find((x) => x.id === trabajoId);
  return t ? proyectar(t, Date.now()) : null;
}

export function listarTrabajos(proyectoId: string): TrabajoInferencia[] {
  const ahora = Date.now();
  return trabajos
    .filter((t) => t.proyectoId === proyectoId)
    .map((t) => proyectar(t, ahora));
}

export function cancelarTrabajo(trabajoId: string): TrabajoInferencia | null {
  const t = trabajos.find((x) => x.id === trabajoId);
  if (!t) return null;
  // Un trabajo ya terminado no se puede cancelar hacia atras.
  if (t.canceladoEnMs === null && Date.now() - t.iniciadoEnMs < DURACION_MS) {
    t.canceladoEnMs = Date.now();
  }
  return proyectar(t, Date.now());
}
