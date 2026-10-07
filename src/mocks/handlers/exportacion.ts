import { http, HttpResponse } from "msw";
import type { CapacidadesExportacion } from "@/shared/api/endpoints";
import { BASE } from "./estado";

export const handlersExportacion = [
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
