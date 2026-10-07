/**
 * Handlers de MSW: espejo de los endpoints reales, un archivo por recurso.
 */
import { handlersDatos } from "./datos";
import { handlersExportacion } from "./exportacion";
import { handlersProyectos } from "./proyectos";
import { handlersTrabajos } from "./trabajos";

export { reiniciarDatosSimulados } from "./estado";

export const handlers = [
  ...handlersProyectos,
  ...handlersDatos,
  ...handlersTrabajos,
  ...handlersExportacion,
];
