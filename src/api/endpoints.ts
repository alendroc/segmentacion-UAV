/**
 * Una funcion por endpoint previsto. Nada de fetch suelto fuera de aqui.
 *
 * Las firmas estan completas desde la Fase 1 aunque las pantallas que las
 * consumen lleguen en fases posteriores: el contrato primero (PLAN.md, Fase 1).
 * La etiqueta RF remite al catalogo de requerimientos del informe.
 */
import { request, requestConCuerpo } from "./client";
import type {
  AreaInteres,
  Copa,
  NuevoProyecto,
  Ortomosaico,
  Proyecto,
  TrabajoInferencia,
} from "./types";

/* ------------------------------------------------------------------ */
/* Proyectos — RF-01                                                   */
/* ------------------------------------------------------------------ */

export function listarProyectos(): Promise<Proyecto[]> {
  return request<Proyecto[]>("/proyectos");
}

export function obtenerProyecto(proyectoId: string): Promise<Proyecto> {
  return request<Proyecto>(`/proyectos/${proyectoId}`);
}

export function crearProyecto(datos: NuevoProyecto): Promise<Proyecto> {
  return requestConCuerpo<Proyecto>("POST", "/proyectos", datos);
}

export function eliminarProyecto(proyectoId: string): Promise<void> {
  return request<void>(`/proyectos/${proyectoId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* Ortomosaico — RF-02 a RF-05                                         */
/* ------------------------------------------------------------------ */

export function obtenerOrtomosaico(proyectoId: string): Promise<Ortomosaico> {
  return request<Ortomosaico>(`/proyectos/${proyectoId}/ortomosaico`);
}

/**
 * Registra el ortomosaico y devuelve el resultado de la validacion de formato,
 * CRS y resolucion. La subida binaria real es responsabilidad del back end.
 */
export function registrarOrtomosaico(
  proyectoId: string,
  metadatos: Pick<
    Ortomosaico,
    "nombreArchivo" | "tamanoBytes" | "formato" | "crs" | "resolucionCmPorPixel"
  >,
): Promise<Ortomosaico> {
  return requestConCuerpo<Ortomosaico>(
    "POST",
    `/proyectos/${proyectoId}/ortomosaico`,
    metadatos,
  );
}

/* ------------------------------------------------------------------ */
/* Inferencia — RF-06 a RF-12                                          */
/* ------------------------------------------------------------------ */

export function iniciarInferencia(
  proyectoId: string,
): Promise<TrabajoInferencia> {
  return requestConCuerpo<TrabajoInferencia>(
    "POST",
    `/proyectos/${proyectoId}/trabajos`,
    {},
  );
}

/** Se consulta por sondeo desde TanStack Query mientras el estado no sea final. */
export function obtenerTrabajo(
  proyectoId: string,
  trabajoId: string,
): Promise<TrabajoInferencia> {
  return request<TrabajoInferencia>(
    `/proyectos/${proyectoId}/trabajos/${trabajoId}`,
  );
}

export function listarTrabajos(
  proyectoId: string,
): Promise<TrabajoInferencia[]> {
  return request<TrabajoInferencia[]>(`/proyectos/${proyectoId}/trabajos`);
}

export function cancelarTrabajo(
  proyectoId: string,
  trabajoId: string,
): Promise<TrabajoInferencia> {
  return requestConCuerpo<TrabajoInferencia>(
    "POST",
    `/proyectos/${proyectoId}/trabajos/${trabajoId}/cancelacion`,
    {},
  );
}

/* ------------------------------------------------------------------ */
/* Copas — RF-13 a RF-22                                               */
/* ------------------------------------------------------------------ */

/**
 * Devuelve todas las copas del proyecto, incluidas las de borrado logico.
 * El filtrado de RF-16 ocurre en el cliente: los filtros ocultan, no borran.
 */
export function listarCopas(proyectoId: string): Promise<Copa[]> {
  return request<Copa[]>(`/proyectos/${proyectoId}/copas`);
}

export function obtenerAreaInteres(proyectoId: string): Promise<AreaInteres> {
  return request<AreaInteres>(`/proyectos/${proyectoId}/area-interes`);
}

/** RF-20. La copa nace con origen "manual". */
export function crearCopa(
  proyectoId: string,
  copa: Pick<Copa, "geometria">,
): Promise<Copa> {
  return requestConCuerpo<Copa>("POST", `/proyectos/${proyectoId}/copas`, copa);
}

/** RF-21, RF-22. Modificar la geometria cambia el origen a "corregido". */
export function actualizarCopa(
  proyectoId: string,
  copaId: string,
  cambios: Partial<Pick<Copa, "geometria" | "eliminada">>,
): Promise<Copa> {
  return requestConCuerpo<Copa>(
    "PATCH",
    `/proyectos/${proyectoId}/copas/${copaId}`,
    cambios,
  );
}

/** RF-19. Borrado logico: marca la copa, no la destruye. */
export function eliminarCopa(
  proyectoId: string,
  copaId: string,
): Promise<Copa> {
  return actualizarCopa(proyectoId, copaId, { eliminada: true });
}

/**
 * RF-21. La geometria de las dos mitades se calcula en el cliente; el back end
 * solo persiste el reemplazo de forma atomica.
 */
export function dividirCopa(
  proyectoId: string,
  copaId: string,
  mitades: [GeoJSON.Polygon, GeoJSON.Polygon],
): Promise<[Copa, Copa]> {
  return requestConCuerpo<[Copa, Copa]>(
    "POST",
    `/proyectos/${proyectoId}/copas/${copaId}/division`,
    { mitades },
  );
}

/** RF-21. Fusiona dos copas fragmentadas en una sola. */
export function unirCopas(
  proyectoId: string,
  copaIds: [string, string],
  geometria: GeoJSON.Polygon,
): Promise<Copa> {
  return requestConCuerpo<Copa>(
    "POST",
    `/proyectos/${proyectoId}/copas/union`,
    { copaIds, geometria },
  );
}

/* ------------------------------------------------------------------ */
/* Exportacion — RF-23 a RF-25                                         */
/* ------------------------------------------------------------------ */

export interface CapacidadesExportacion {
  geojson: boolean;
  csv: boolean;
  /** Falso mientras no exista back end: no se simula la descarga. */
  geopackage: boolean;
  /** Falso mientras no exista back end: no se simula la descarga. */
  reportePdf: boolean;
  motivoNoDisponible: string;
}

export function obtenerCapacidadesExportacion(
  proyectoId: string,
): Promise<CapacidadesExportacion> {
  return request<CapacidadesExportacion>(
    `/proyectos/${proyectoId}/exportacion/capacidades`,
  );
}
