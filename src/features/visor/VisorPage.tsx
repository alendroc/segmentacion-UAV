import { AlertTriangle, ImageOff, Info } from "lucide-react";
import { useParams } from "react-router-dom";
import type { Ortomosaico } from "@/api/types";
import { MapaBase } from "@/components/mapa/MapaBase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearBytes } from "@/lib/formato";
import { useOrtomosaico } from "@/features/visor/useOrtomosaico";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm tabular-nums">{valor}</dd>
    </div>
  );
}

function FichaOrtomosaico({ ortomosaico }: { ortomosaico: Ortomosaico }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      <Dato etiqueta="Archivo" valor={ortomosaico.nombreArchivo} />
      <Dato etiqueta="Sistema de referencia" valor={ortomosaico.crs} />
      <Dato
        etiqueta="Resolucion"
        valor={`${ortomosaico.resolucionCmPorPixel} cm/pixel`}
      />
      <Dato etiqueta="Tamano" valor={formatearBytes(ortomosaico.tamanoBytes)} />
    </dl>
  );
}

export function VisorPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();
  const { data: ortomosaico, isPending, isError, error } = useOrtomosaico(proyectoId);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Visor
          </h1>
          <p className="text-sm text-muted-foreground">
            Navegacion cartografica en CRTM05. Las copas y su panel de detalle
            llegan en la Fase 4.
          </p>
        </div>
        <Badge variant="outline">EPSG:5367</Badge>
      </header>

      {isPending ? <Skeleton className="h-[540px] w-full rounded-lg" /> : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>No fue posible cargar el ortomosaico</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {ortomosaico ? (
        <>
          <MapaBase
            urlImagen={ortomosaico.urlCog}
            extension={[
              ortomosaico.extension.minX,
              ortomosaico.extension.minY,
              ortomosaico.extension.maxX,
              ortomosaico.extension.maxY,
            ]}
            className="h-[540px] w-full"
          />

          <FichaOrtomosaico ortomosaico={ortomosaico} />

          {ortomosaico.validacion.mensajes.length > 0 ? (
            <Alert>
              <ImageOff aria-hidden />
              <AlertTitle>La imagen de fondo es un sustituto</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4">
                  {ortomosaico.validacion.mensajes.map((mensaje) => (
                    <li key={mensaje}>{mensaje}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <Alert>
            <Info aria-hidden />
            <AlertTitle>Rendimiento sobre COG: sin verificar</AlertTitle>
            <AlertDescription>
              El destino de esta capa es un COG servido con rangos HTTP, del que
              solo se descarga el area visible. Ese comportamiento no se ha
              podido comprobar porque todavia no existe un ortomosaico real, y
              es el riesgo tecnico principal del proyecto.
            </AlertDescription>
          </Alert>
        </>
      ) : null}
    </section>
  );
}
