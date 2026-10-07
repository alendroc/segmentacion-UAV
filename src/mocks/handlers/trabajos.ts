import { http, HttpResponse } from "msw";
import type { ParametrosInferencia, RespuestaError, TrabajoInferencia } from "@/shared/api/types";
import { COPAS, ORTOMOSAICO, PROYECTO_CON_DATOS } from "../fixtures";
import {
  cancelarTrabajo as cancelarTrabajoSimulado,
  contarMosaicos,
  crearTrabajo,
  listarTrabajos,
  obtenerTrabajo as obtenerTrabajoSimulado,
} from "../trabajos";
import { BASE, noEncontrado, PROYECTOS } from "./estado";

export const handlersTrabajos = [
  /* Inferencia — RF-06 a RF-12 */
  http.get(`${BASE}/proyectos/:proyectoId/trabajos`, ({ params }) =>
    HttpResponse.json<TrabajoInferencia[]>(
      listarTrabajos(String(params.proyectoId)),
    ),
  ),

  http.post(`${BASE}/proyectos/:proyectoId/trabajos`, async ({ request, params }) => {
    const proyectoId = String(params.proyectoId);
    const proyecto = PROYECTOS.find((p) => p.id === proyectoId);
    if (!proyecto) return noEncontrado("El proyecto solicitado no existe.");
    if (proyectoId !== PROYECTO_CON_DATOS) {
      const cuerpo: RespuestaError = {
        mensaje: "El proyecto no tiene una imagen cargada.",
        detalle: "Cargue una imagen antes de ejecutar la deteccion.",
      };
      return HttpResponse.json(cuerpo, { status: 409 });
    }

    const parametros = (await request.json()) as ParametrosInferencia;

    // Tamano en pixeles a partir de la extension real y la resolucion declarada.
    const metrosPorPixel = ORTOMOSAICO.resolucionCmPorPixel / 100;
    const anchoPx =
      (ORTOMOSAICO.extension.maxX - ORTOMOSAICO.extension.minX) / metrosPorPixel;
    const altoPx =
      (ORTOMOSAICO.extension.maxY - ORTOMOSAICO.extension.minY) / metrosPorPixel;

    const trabajo = crearTrabajo({
      proyectoId,
      ortomosaicoId: ORTOMOSAICO.id,
      parametros,
      mosaicosTotales: contarMosaicos(anchoPx, altoPx, parametros),
      copasAlTerminar: COPAS.length,
    });

    proyecto.estado = "procesando";
    proyecto.actualizadoEn = new Date().toISOString();

    return HttpResponse.json(trabajo, { status: 202 });
  }),

  http.get(
    `${BASE}/proyectos/:proyectoId/trabajos/:trabajoId`,
    ({ params }) => {
      const trabajo = obtenerTrabajoSimulado(String(params.trabajoId));
      if (!trabajo) return noEncontrado("El trabajo solicitado no existe.");

      // Al terminar, el proyecto refleja el resultado.
      if (trabajo.estado === "completado") {
        const proyecto = PROYECTOS.find((p) => p.id === trabajo.proyectoId);
        if (proyecto) {
          proyecto.estado = "completado";
          proyecto.totalCopas = trabajo.copasDetectadas;
        }
      }
      return HttpResponse.json(trabajo);
    },
  ),

  http.post(
    `${BASE}/proyectos/:proyectoId/trabajos/:trabajoId/cancelacion`,
    ({ params }) => {
      const trabajo = cancelarTrabajoSimulado(String(params.trabajoId));
      if (!trabajo) return noEncontrado("El trabajo solicitado no existe.");
      const proyecto = PROYECTOS.find((p) => p.id === trabajo.proyectoId);
      if (proyecto) proyecto.estado = "ortomosaico_cargado";
      return HttpResponse.json(trabajo);
    },
  ),
];
