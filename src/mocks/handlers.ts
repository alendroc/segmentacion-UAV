/**
 * Handlers de MSW: espejo de los endpoints reales.
 *
 * Este archivo y todo src/mocks/ son INVISIBLES para el resto de la aplicacion.
 * Ningun archivo de src/features/, src/components/ o src/store/ puede importarlo
 * (CLAUDE.md, seccion 2).
 */
import { http, HttpResponse } from "msw";
import type { CapacidadesExportacion } from "@/api/endpoints";
import type {
  AreaInteres,
  Copa,
  NuevoProyecto,
  Ortomosaico,
  Proyecto,
  RespuestaError,
  TrabajoInferencia,
} from "@/api/types";
import {
  AREA_DE_INTERES,
  COPAS,
  ORTOMOSAICO,
  PROYECTO_CON_DATOS,
} from "./fixtures";

const BASE = "/api";

/**
 * Los tres estados que exige la Fase 8 estan representados: lista con datos, un
 * proyecto en proceso y uno con error de georreferencia. La lista vacia se
 * reproduce con el parametro de solo-simulacion "_escenario".
 *
 * Es una funcion, no una constante, porque el mock tiene estado: crear o
 * eliminar proyectos lo modifica. `reiniciarDatosSimulados()` lo devuelve al
 * punto de partida entre pruebas.
 */
function proyectosIniciales(): Proyecto[] {
  return [
    {
      id: PROYECTO_CON_DATOS,
      nombre: "Lote Norte",
      descripcion:
        "Parcela permanente de monitoreo en bosque tropical seco secundario.",
      sitio: "Nicoya, Guanacaste",
      creadoEn: "2026-03-11T15:20:00.000Z",
      actualizadoEn: "2026-04-02T18:05:00.000Z",
      estado: "completado",
      ortomosaicoId: "om-001",
      // Se deriva del fixture: si el generador cambia, el conteo lo acompana.
      totalCopas: COPAS.length,
      urlMiniatura: "/simulacion/vuelo-lote-norte-mini.jpg",
    },
    {
      id: "pr-002",
      nombre: "Quebrada Seca",
      descripcion:
        "Transecto ribereno con dosel discontinuo y arbolado caducifolio.",
      sitio: "Santa Cruz, Guanacaste",
      creadoEn: "2026-04-18T14:00:00.000Z",
      actualizadoEn: "2026-04-18T14:42:00.000Z",
      estado: "procesando",
      ortomosaicoId: "om-002",
      totalCopas: null,
      urlMiniatura: null,
    },
    {
      id: "pr-003",
      nombre: "Hacienda La Pacifica",
      descripcion:
        "Vuelo de reconocimiento. El archivo no declara sistema de referencia.",
      sitio: "Canas, Guanacaste",
      creadoEn: "2026-04-25T09:30:00.000Z",
      actualizadoEn: "2026-04-25T09:34:00.000Z",
      estado: "error_georreferencia",
      ortomosaicoId: "om-003",
      totalCopas: null,
      urlMiniatura: null,
    },
    {
      id: "pr-004",
      nombre: "Barra Honda sector sur",
      descripcion: "Proyecto creado, a la espera de la carga del ortomosaico.",
      sitio: "Barra Honda, Guanacaste",
      creadoEn: "2026-05-02T21:10:00.000Z",
      actualizadoEn: "2026-05-02T21:10:00.000Z",
      estado: "sin_ortomosaico",
      ortomosaicoId: null,
      totalCopas: null,
      urlMiniatura: null,
    },
  ];
}

const PROYECTOS: Proyecto[] = proyectosIniciales();

/** Devuelve el mock a su estado de partida. Lo llama `src/test/setup.ts`. */
export function reiniciarDatosSimulados(): void {
  PROYECTOS.splice(0, PROYECTOS.length, ...proyectosIniciales());
}

function noEncontrado(mensaje: string) {
  const cuerpo: RespuestaError = { mensaje, detalle: null };
  return HttpResponse.json(cuerpo, { status: 404 });
}

export const handlers = [
  /* Proyectos — RF-01 */
  http.get(`${BASE}/proyectos`, ({ request }) => {
    const escenario = new URL(request.url).searchParams.get("_escenario");
    if (escenario === "vacio") {
      return HttpResponse.json<Proyecto[]>([]);
    }
    if (escenario === "error") {
      const cuerpo: RespuestaError = {
        mensaje: "No fue posible recuperar la lista de proyectos.",
        detalle: "Escenario de simulacion.",
      };
      return HttpResponse.json(cuerpo, { status: 500 });
    }
    return HttpResponse.json(PROYECTOS);
  }),

  /*
   * Creacion de proyecto — RF-01.
   * El mock guarda en memoria: los proyectos nuevos sobreviven a la navegacion
   * dentro de la sesion, pero no a recargar la pagina. Un back end real
   * persistiria; simular persistencia de disco seria mentir sobre lo que hay.
   */
  http.post(`${BASE}/proyectos`, async ({ request }) => {
    const datos = (await request.json()) as NuevoProyecto;

    const nombre = datos.nombre?.trim();
    if (!nombre) {
      const cuerpo: RespuestaError = {
        mensaje: "El nombre del proyecto es obligatorio.",
        detalle: null,
      };
      return HttpResponse.json(cuerpo, { status: 422 });
    }

    const ahora = new Date().toISOString();
    const proyecto: Proyecto = {
      id: `pr-${Date.now().toString(36)}`,
      nombre,
      descripcion: datos.descripcion?.trim() ?? "",
      sitio: datos.sitio?.trim() ?? "",
      creadoEn: ahora,
      actualizadoEn: ahora,
      estado: "sin_ortomosaico",
      ortomosaicoId: null,
      totalCopas: null,
      urlMiniatura: null,
    };
    PROYECTOS.unshift(proyecto);
    return HttpResponse.json(proyecto, { status: 201 });
  }),

  http.delete(`${BASE}/proyectos/:proyectoId`, ({ params }) => {
    const i = PROYECTOS.findIndex((p) => p.id === params.proyectoId);
    if (i < 0) return noEncontrado("El proyecto solicitado no existe.");
    PROYECTOS.splice(i, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/proyectos/:proyectoId`, ({ params }) => {
    const proyecto = PROYECTOS.find((p) => p.id === params.proyectoId);
    return proyecto
      ? HttpResponse.json(proyecto)
      : noEncontrado("El proyecto solicitado no existe.");
  }),

  /* Ortomosaico — RF-02 a RF-05 */
  http.get(`${BASE}/proyectos/:proyectoId/ortomosaico`, ({ params }) =>
    params.proyectoId === PROYECTO_CON_DATOS
      ? HttpResponse.json<Ortomosaico>(ORTOMOSAICO)
      : noEncontrado("El proyecto no tiene un ortomosaico cargado."),
  ),

  /* Copas — RF-13. Solo el proyecto con deteccion ejecutada tiene copas. */
  http.get(`${BASE}/proyectos/:proyectoId/copas`, ({ params }) =>
    HttpResponse.json<Copa[]>(
      params.proyectoId === PROYECTO_CON_DATOS ? COPAS : [],
    ),
  ),

  /* Area de interes — denominador de la densidad de RF-18. */
  http.get(`${BASE}/proyectos/:proyectoId/area-interes`, ({ params }) =>
    params.proyectoId === PROYECTO_CON_DATOS
      ? HttpResponse.json<AreaInteres>(AREA_DE_INTERES)
      : noEncontrado("El proyecto no tiene un area de interes definida."),
  ),

  /* Inferencia — RF-06 a RF-12. Se implementa en la Fase 8. */
  http.get(`${BASE}/proyectos/:proyectoId/trabajos`, () =>
    HttpResponse.json<TrabajoInferencia[]>([]),
  ),

  /* Exportacion — RF-23 a RF-25 */
  http.get(`${BASE}/proyectos/:proyectoId/exportacion/capacidades`, () =>
    HttpResponse.json<CapacidadesExportacion>({
      geojson: true,
      csv: true,
      geopackage: false,
      reportePdf: false,
      motivoNoDisponible:
        "GeoPackage y el reporte PDF se generan en el back end, que aun no existe.",
    }),
  ),
];
