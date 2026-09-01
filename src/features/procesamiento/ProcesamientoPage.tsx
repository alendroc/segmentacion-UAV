import { AlertTriangle, ArrowRight, Ban, Play, RotateCcw } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  PARAMETROS_POR_DEFECTO,
  type ParametrosInferencia,
  type TrabajoInferencia,
} from "@/api/types";
import { AccionesDePaso } from "@/components/layout/AccionesDePaso";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Bitacora } from "@/features/procesamiento/Bitacora";
import {
  esFinal,
  useCancelarTrabajo,
  useIniciarInferencia,
  useTrabajos,
} from "@/features/procesamiento/useTrabajos";
import { formatearEntero } from "@/lib/formato";
import { rutaDePaso } from "@/lib/pasos";

const ETIQUETA_ESTADO: Record<TrabajoInferencia["estado"], string> = {
  en_cola: "En cola",
  ejecutando: "Ejecutando",
  completado: "Completado",
  fallido: "Fallido",
  cancelado: "Cancelado",
};

function Campo({
  etiqueta,
  ayuda,
  ...props
}: {
  etiqueta: string;
  ayuda: string;
} & React.ComponentProps<typeof Input>) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} type="number" {...props} />
      <p className="text-xs text-muted-foreground">{ayuda}</p>
    </div>
  );
}

function Configuracion({
  onEjecutar,
  ejecutando,
  error,
}: {
  onEjecutar: (p: ParametrosInferencia) => void;
  ejecutando: boolean;
  error: Error | null;
}) {
  const [p, setP] = useState<ParametrosInferencia>(PARAMETROS_POR_DEFECTO);

  function cambiar<C extends keyof ParametrosInferencia>(
    clave: C,
    valor: number,
  ) {
    setP((previo) => ({ ...previo, [clave]: valor }));
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    onEjecutar(p);
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Tamano de mosaico (px)"
          ayuda="El ortomosaico no cabe en memoria: se recorta y se procesa por partes."
          min={256}
          max={2048}
          step={128}
          value={p.tamanoMosaicoPx}
          onChange={(e) => cambiar("tamanoMosaicoPx", Number(e.target.value))}
        />
        <Campo
          etiqueta="Traslape entre mosaicos (%)"
          ayuda="Sin traslape, las copas del borde se parten. Con el, hay que unirlas despues."
          min={0}
          max={50}
          step={5}
          value={p.traslapePct}
          onChange={(e) => cambiar("traslapePct", Number(e.target.value))}
        />
        <Campo
          etiqueta="Umbral de confianza inicial"
          ayuda="Se puede mover despues en el visor sin volver a procesar."
          min={0}
          max={0.99}
          step={0.05}
          value={p.confianzaMinima}
          onChange={(e) => cambiar("confianzaMinima", Number(e.target.value))}
        />
        <Campo
          etiqueta="Area minima de copa (m²)"
          ayuda="Descarta detecciones demasiado pequenas para ser una copa."
          min={0}
          max={20}
          step={0.5}
          value={p.areaMinimaM2}
          onChange={(e) => cambiar("areaMinimaM2", Number(e.target.value))}
        />
      </div>

      <div className="rounded-md border border-dashed p-3">
        <p className="text-xs font-medium">Modelo</p>
        <p className="text-xs text-muted-foreground">
          Todavia no hay modelo entrenado. Cuando exista, aqui se elegira la
          arquitectura y el archivo de pesos. Esta pantalla valida el flujo, no
          el desempeno de ninguna red.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={ejecutando}>
        <Play aria-hidden />
        {ejecutando ? "Lanzando…" : "Ejecutar deteccion"}
      </Button>
    </form>
  );
}

function Seguimiento({
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
              <Configuracion
                ejecutando={iniciar.isPending}
                error={iniciar.error}
                onEjecutar={(p) => {
                  setForzarConfiguracion(false);
                  iniciar.mutate(p);
                }}
              />
            ) : ultimo ? (
              <Seguimiento
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
