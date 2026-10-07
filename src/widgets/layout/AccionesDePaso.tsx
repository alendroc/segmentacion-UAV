import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import {
  pasoAnterior,
  pasoSiguiente,
  rutaDePaso,
  type ClavePaso,
} from "@/shared/lib/pasos";

export interface PropsAccionesDePaso {
  proyectoId: string;
  paso: ClavePaso;
}

/**
 * Avance y retroceso dentro del flujo de trabajo, mas la salida al inicio.
 * Siempre hay una forma visible de volver: la miga de pan de la cabecera y este
 * boton de "Todos los proyectos".
 */
export function AccionesDePaso({ proyectoId, paso }: PropsAccionesDePaso) {
  const anterior = pasoAnterior(paso);
  const siguiente = pasoSiguiente(paso);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/proyectos">
          <LayoutGrid aria-hidden />
          Todos los proyectos
        </Link>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {anterior ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={rutaDePaso(proyectoId, anterior.clave)}>
              <ArrowLeft aria-hidden />
              {anterior.etiqueta}
            </Link>
          </Button>
        ) : null}

        {siguiente ? (
          <Button size="sm" asChild>
            <Link to={rutaDePaso(proyectoId, siguiente.clave)}>
              Siguiente: {siguiente.etiqueta}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link to="/proyectos">
              Terminar y volver al inicio
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
