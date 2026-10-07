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
  ParametrosInferencia,
  TrabajoInferencia,
} from "../shared/api/types";
import {
  bitacoraDe,
  DURACION_MS,
  etapaDe,
  marca,
  type Almacenado,
} from "./bitacoraTrabajo.ts";

export { DURACION_MS };

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
