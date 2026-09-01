import { AlertTriangle, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CapaCopas } from "@/components/mapa/CapaCopas";
import { MapaBase } from "@/components/mapa/MapaBase";
import { AccionesDePaso } from "@/components/layout/AccionesDePaso";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { APARIENCIAS, estadoDeCopa } from "@/features/visor/estilosCopa";
import { PanelDetalle } from "@/features/visor/PanelDetalle";
import { useCopas } from "@/features/visor/useCopas";
import { useOrtomosaico } from "@/features/visor/useOrtomosaico";
import { formatearArea, formatearEntero } from "@/lib/formato";

function Simbologia({ presentes }: { presentes: Set<string> }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {Object.entries(APARIENCIAS)
        .filter(([clave]) => presentes.has(clave))
        .map(([clave, apariencia]) => (
          <li key={clave} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="inline-block h-0 w-4 rounded-full"
              style={{
                borderTop: `2px ${apariencia.discontinuo ? "dashed" : "solid"} var(--${apariencia.token})`,
                opacity: apariencia.opacidad,
              }}
            />
            <span className="text-muted-foreground">{apariencia.etiqueta}</span>
          </li>
        ))}
    </ul>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <span className="text-sm font-medium tabular-nums">{valor}</span>
    </div>
  );
}

export function VisorPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);

  const ortomosaico = useOrtomosaico(proyectoId);
  const copasQuery = useCopas(proyectoId);
  const copas = useMemo(() => copasQuery.data ?? [], [copasQuery.data]);

  const visibles = useMemo(() => copas.filter((c) => !c.eliminada), [copas]);
  const seleccionada = copas.find((c) => c.id === seleccionadaId) ?? null;

  const estados = useMemo(
    () => new Set(copas.map((copa) => estadoDeCopa(copa))),
    [copas],
  );

  const areaTotal = visibles.reduce((suma, c) => suma + c.areaM2, 0);
  const diametroMedio = visibles.length
    ? visibles.reduce((s, c) => s + c.diametroM, 0) / visibles.length
    : 0;

  const cargando = ortomosaico.isPending || copasQuery.isPending;
  const fallo = ortomosaico.error ?? copasQuery.error;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Visor de resultados
          </h1>
          <p className="text-sm text-muted-foreground">
            Haga clic sobre una copa para ver su segmentacion y sus atributos.
          </p>
        </div>
        <Badge variant="outline">EPSG:5367</Badge>
      </header>

      {cargando ? <Skeleton className="h-[560px] w-full rounded-lg" /> : null}

      {fallo ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>No fue posible cargar el visor</AlertTitle>
          <AlertDescription>{fallo.message}</AlertDescription>
        </Alert>
      ) : null}

      {ortomosaico.data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-3">
              <MapaBase
                urlImagen={ortomosaico.data.urlCog}
                extension={[
                  ortomosaico.data.extension.minX,
                  ortomosaico.data.extension.minY,
                  ortomosaico.data.extension.maxX,
                  ortomosaico.data.extension.maxY,
                ]}
                className="h-[560px] w-full"
              >
                <CapaCopas
                  copas={copas}
                  seleccionadaId={seleccionadaId}
                  onSeleccionar={setSeleccionadaId}
                />
              </MapaBase>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <Simbologia presentes={estados} />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Metrica
                    etiqueta="Copas visibles"
                    valor={formatearEntero(visibles.length)}
                  />
                  <Metrica
                    etiqueta="Area de copa total"
                    valor={formatearArea(areaTotal)}
                  />
                  <Metrica
                    etiqueta="Diametro medio"
                    valor={`${diametroMedio.toFixed(2).replace(".", ",")} m`}
                  />
                </div>
              </div>
            </div>

            <PanelDetalle
              copa={seleccionada}
              urlImagen={ortomosaico.data.urlCog}
              extension={ortomosaico.data.extension}
            />
          </div>

          {ortomosaico.data.validacion.mensajes.length > 0 ? (
            <Alert>
              <ImageOff aria-hidden />
              <AlertTitle>La imagen de fondo es un sustituto</AlertTitle>
              <AlertDescription>
                No hay ortomosaico real: el fondo es una simulacion generada con
                la misma semilla que las copas, y el rendimiento sobre un COG de
                gran tamano sigue sin verificarse.
              </AlertDescription>
            </Alert>
          ) : null}

          <AccionesDePaso proyectoId={proyectoId} paso="visor" />
        </>
      ) : null}
    </section>
  );
}
