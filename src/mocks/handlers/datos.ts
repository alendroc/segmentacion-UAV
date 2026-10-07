import { http, HttpResponse } from "msw";
import type { AreaInteres, Copa, Ortomosaico } from "@/shared/api/types";
import { AREA_DE_INTERES, COPAS, ORTOMOSAICO, PROYECTO_CON_DATOS } from "../fixtures";
import { BASE, noEncontrado } from "./estado";

export const handlersDatos = [
  /* Ortomosaico — RF-02 a RF-05 */
  http.get(`${BASE}/proyectos/:proyectoId/ortomosaico`, ({ params }) =>
    params.proyectoId === PROYECTO_CON_DATOS
      ? HttpResponse.json<Ortomosaico>(ORTOMOSAICO)
      : noEncontrado("El proyecto no tiene una imagen cargada."),
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
];
