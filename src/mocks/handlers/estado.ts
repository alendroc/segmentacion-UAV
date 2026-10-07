/**
 * Estado en memoria del mock y utilidades comunes de los handlers.
 *
 * Todo src/mocks/ es INVISIBLE para el resto de la aplicacion: solo src/app/ y
 * src/test/ pueden importarlo (CLAUDE.md, seccion 2).
 */
import { HttpResponse } from "msw";
import type { Proyecto, RespuestaError } from "@/shared/api/types";
import { COPAS, PROYECTO_CON_DATOS } from "../fixtures";
import { reiniciarTrabajos } from "../trabajos";

export const BASE = "/api";

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
      descripcion: "Proyecto creado, a la espera de la carga de la imagen.",
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

export const PROYECTOS: Proyecto[] = proyectosIniciales();

/** Devuelve el mock a su estado de partida. Lo llama `src/test/setup.ts`. */
export function reiniciarDatosSimulados(): void {
  PROYECTOS.splice(0, PROYECTOS.length, ...proyectosIniciales());
  reiniciarTrabajos();
}

export function noEncontrado(mensaje: string) {
  const cuerpo: RespuestaError = { mensaje, detalle: null };
  return HttpResponse.json(cuerpo, { status: 404 });
}
