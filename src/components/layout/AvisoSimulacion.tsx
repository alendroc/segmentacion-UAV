import { FlaskConical } from "lucide-react";

/**
 * Aviso permanente y visible de que los datos son simulados y de que no hay
 * modelo ejecutandose (CLAUDE.md, seccion 9). No se quita.
 */
export function AvisoSimulacion() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-copa-confianza-baja/40 bg-copa-confianza-baja/15 px-4 py-1.5 text-center text-xs text-foreground"
    >
      <FlaskConical aria-hidden className="size-3.5 shrink-0" />
      <p>
        <span className="font-medium">Datos simulados.</span> No hay ningun
        modelo de aprendizaje profundo en ejecucion: las detecciones provienen de
        un generador sintetico y sirven para validar la interfaz.
      </p>
    </div>
  );
}
