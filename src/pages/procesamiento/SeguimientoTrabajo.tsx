import { ArrowRight, Ban, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import type { TrabajoInferencia } from "@/shared/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { Bitacora } from "@/widgets/bitacora";
import { esFinal } from "@/entities/trabajo";
import { formatearEntero } from "@/shared/lib/formato";
import { rutaDePaso } from "@/shared/lib/pasos";

const ETIQUETA_ESTADO: Record<TrabajoInferencia["estado"], string> = {
  en_cola: "En cola",
  ejecutando: "Ejecutando",
  completado: "Completado",
  fallido: "Fallido",
  cancelado: "Cancelado",
};

export function SeguimientoTrabajo({
  trabajo,
  proyectoId,
  onCancelar,
  cancelando,
  onReiniciar,
}: {
  trabajo: TrabajoInferencia;
  proyectoId: string;
  onCancelar: () => void;
  cancelando: boolean;
  onReiniciar: () => void;
}) {
  const terminado = esFinal(trabajo);
  const enCurso = !terminado;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={trabajo.estado === "completado" ? "default" : "secondary"}>
            {ETIQUETA_ESTADO[trabajo.estado]}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {trabajo.id}
          </span>
        </div>
        {enCurso ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelar}
            disabled={cancelando}
          >
            <Ban aria-hidden />
            Cancelar
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onReiniciar}>
            <RotateCcw aria-hidden />
            Ejecutar de nuevo
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">{trabajo.etapa}</p>
          <p className="text-sm tabular-nums">{trabajo.progreso} %</p>
        </div>
        <Progress value={trabajo.progreso} />
        {enCurso && trabajo.mosaicosTotales > 0 ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            Mosaico {trabajo.mosaicoActual} de {trabajo.mosaicosTotales}
          </p>
        ) : null}
      </div>

      <Bitacora entradas={trabajo.bitacora} />

      {trabajo.estado === "completado" ? (
        <Alert>
          <AlertTitle>
            {formatearEntero(trabajo.copasDetectadas ?? 0)} copas detectadas
          </AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>
              Revise y corrija los resultados antes de exportarlos.
            </span>
            <Button size="sm" asChild>
              <Link to={rutaDePaso(proyectoId, "visor")}>
                Ir al visor
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
