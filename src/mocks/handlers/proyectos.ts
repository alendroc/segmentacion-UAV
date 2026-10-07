import { http, HttpResponse } from "msw";
import type { NuevoProyecto, Proyecto, RespuestaError } from "@/shared/api/types";
import { BASE, noEncontrado, PROYECTOS } from "./estado";

export const handlersProyectos = [
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
];
