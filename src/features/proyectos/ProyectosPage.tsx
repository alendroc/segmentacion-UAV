import { AlertTriangle, FolderOpen, ImageOff, MapPin, TreePine } from "lucide-react";
import { Link } from "react-router-dom";
import type { EstadoProyecto, Proyecto } from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogoNuevoProyecto } from "@/features/proyectos/DialogoNuevoProyecto";
import { describirEstado } from "@/features/proyectos/estadoProyecto";
import { useProyectos } from "@/features/proyectos/useProyectos";
import { formatearEntero, formatearFecha } from "@/lib/formato";
import { rutaDePaso, type ClavePaso } from "@/lib/pasos";

/** Donde tiene sentido entrar segun donde quedo el proyecto. */
function pasoDeEntrada(estado: EstadoProyecto): ClavePaso {
  switch (estado) {
    case "sin_ortomosaico":
    case "error_georreferencia":
      return "carga";
    case "ortomosaico_cargado":
    case "procesando":
      return "procesamiento";
    case "completado":
      return "visor";
  }
}

function TarjetaProyecto({ proyecto }: { proyecto: Proyecto }) {
  const estado = describirEstado(proyecto.estado);
  const destino = rutaDePaso(proyecto.id, pasoDeEntrada(proyecto.estado));

  return (
    <Card className="overflow-hidden pt-0 transition-colors hover:border-primary/40">
      <div className="aspect-[3/2] w-full overflow-hidden border-b bg-muted">
        {proyecto.urlMiniatura ? (
          <img
            src={proyecto.urlMiniatura}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden className="size-6 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <Link
            to={destino}
            className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {proyecto.nombre}
          </Link>
          <Badge variant={estado.variante}>{estado.etiqueta}</Badge>
        </CardTitle>
        <CardDescription>{proyecto.descripcion}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <MapPin aria-hidden className="size-3.5" />
          {proyecto.sitio}
        </p>
        <p className="flex items-center gap-1.5">
          <TreePine aria-hidden className="size-3.5" />
          {proyecto.totalCopas === null
            ? "Sin deteccion ejecutada"
            : `${formatearEntero(proyecto.totalCopas)} copas detectadas`}
        </p>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Actualizado el {formatearFecha(proyecto.actualizadoEn)}
      </CardFooter>
    </Card>
  );
}

function Cargando() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Cargando proyectos"
    >
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2 h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SinProyectos() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <FolderOpen aria-hidden className="size-6 text-muted-foreground" />
        <p className="font-medium">Todavia no hay proyectos</p>
        <CardDescription>
          Un proyecto agrupa un ortomosaico y las copas detectadas sobre el.
        </CardDescription>
        <div className="mt-2">
          <DialogoNuevoProyecto />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProyectosPage() {
  const { data: proyectos, isPending, isError, error } = useProyectos();

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Proyectos
          </h1>
          <p className="text-sm text-muted-foreground">
            Levantamientos con vehiculo aereo no tripulado en el bosque tropical
            seco de la Region Chorotega. Abra uno para recorrer el flujo
            completo.
          </p>
        </div>
        <DialogoNuevoProyecto />
      </header>

      {isPending ? <Cargando /> : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>No fue posible cargar los proyectos</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {proyectos && proyectos.length === 0 ? <SinProyectos /> : null}

      {proyectos && proyectos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto) => (
            <TarjetaProyecto key={proyecto.id} proyecto={proyecto} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
