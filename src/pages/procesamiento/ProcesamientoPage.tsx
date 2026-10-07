import { useState } from "react";
import { useParams } from "react-router-dom";
import { AccionesDePaso } from "@/widgets/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  useCancelarTrabajo,
  useIniciarInferencia,
  useTrabajos,
} from "@/entities/trabajo";
import { ConfiguracionInferencia } from "./ConfiguracionInferencia";
import { SeguimientoTrabajo } from "./SeguimientoTrabajo";

export function ProcesamientoPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();
  const [forzarConfiguracion, setForzarConfiguracion] = useState(false);

  const trabajos = useTrabajos(proyectoId);
  const iniciar = useIniciarInferencia(proyectoId);
  const cancelar = useCancelarTrabajo(proyectoId);

  const ultimo = trabajos.data?.[0] ?? null;
  const mostrarConfiguracion = !ultimo || forzarConfiguracion;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Procesamiento
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure el recorte y los umbrales, ejecute la deteccion y siga su
          avance. Puede navegar a otras pantallas sin perder el seguimiento.
        </p>
      </header>

      {trabajos.isPending ? (
        <Skeleton className="h-72 w-full rounded-lg" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {mostrarConfiguracion ? "Parametros" : "Avance del trabajo"}
            </CardTitle>
            <CardDescription>
              {mostrarConfiguracion
                ? "Estos valores quedan registrados con el trabajo y se pueden citar en el informe."
                : "El avance se consulta por sondeo cada segundo hasta que el trabajo termina."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mostrarConfiguracion ? (
              <ConfiguracionInferencia
                ejecutando={iniciar.isPending}
                error={iniciar.error}
                onEjecutar={(p) => {
                  setForzarConfiguracion(false);
                  iniciar.mutate(p);
                }}
              />
            ) : ultimo ? (
              <SeguimientoTrabajo
                trabajo={ultimo}
                proyectoId={proyectoId}
                cancelando={cancelar.isPending}
                onCancelar={() => cancelar.mutate(ultimo.id)}
                onReiniciar={() => setForzarConfiguracion(true)}
              />
            ) : null}
          </CardContent>
        </Card>
      )}

      <AccionesDePaso proyectoId={proyectoId} paso="procesamiento" />
    </section>
  );
}
