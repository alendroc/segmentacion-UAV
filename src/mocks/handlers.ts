/**
 * Handlers de MSW: espejo de los endpoints reales.
 *
 * Este archivo y todo src/mocks/ son INVISIBLES para el resto de la aplicacion.
 * Ningun archivo de src/features/, src/components/ o src/store/ puede importarlo
 * (CLAUDE.md, seccion 2).
 */
import { http, HttpResponse } from "msw";
import type {
  CapacidadesExportacion,
} from "@/api/endpoints";
import type {
  Copa,
  Proyecto,
  RespuestaError,
  TrabajoInferencia,
} from "@/api/types";

const BASE = "/api";

/**
 * Datos de la Fase 1. Los tres estados que exige la Fase 8 estan representados:
 * lista con datos, un proyecto en proceso y uno con error de georreferencia.
 * La lista vacia se reproduce con el parametro de solo-simulacion "_escenario".
 */
const PROYECTOS: Proyecto[] = [
  {
    id: "pr-001",
    nombre: "Lote Norte",
    descripcion:
      "Parcela permanente de monitoreo en bosque tropical seco secundario.",
    sitio: "Nicoya, Guanacaste",
    creadoEn: "2026-03-11T15:20:00.000Z",
    actualizadoEn: "2026-04-02T18:05:00.000Z",
    estado: "completado",
    ortomosaicoId: "om-001",
    totalCopas: 147,
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
  },
];

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

  http.get(`${BASE}/proyectos/:proyectoId`, ({ params }) => {
    const proyecto = PROYECTOS.find((p) => p.id === params.proyectoId);
    return proyecto
      ? HttpResponse.json(proyecto)
      : noEncontrado("El proyecto solicitado no existe.");
  }),

  /* Copas — RF-13. Se llenan en la Fase 2 con el generador sintetico. */
  http.get(`${BASE}/proyectos/:proyectoId/copas`, () =>
    HttpResponse.json<Copa[]>([]),
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
