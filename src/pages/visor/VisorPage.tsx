import { AlertTriangle, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CapaCopas } from "@/widgets/mapa";
import { MapaBase } from "@/widgets/mapa";
import { AccionesDePaso } from "@/widgets/layout";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { APARIENCIAS, estadoDeCopa } from "@/entities/copa";
import { calcularMetricas, filtrarCopas } from "@/entities/copa";
import { PanelDetalle } from "@/widgets/panel-detalle";
import { PanelFiltros } from "@/widgets/panel-filtros";
import { PanelMetricas } from "@/widgets/panel-metricas";
import { useAreaInteres } from "@/entities/ortomosaico";
import { useCopas } from "@/entities/copa";
import { useOrtomosaico } from "@/entities/ortomosaico";
import { useFiltrosStore } from "@/entities/copa";

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

export function VisorPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const filtros = useFiltrosStore((e) => e.filtros);

  const ortomosaico = useOrtomosaico(proyectoId);
  const copasQuery = useCopas(proyectoId);
  const areaQuery = useAreaInteres(proyectoId);

  const copas = useMemo(() => copasQuery.data ?? [], [copasQuery.data]);
  const areaHa = areaQuery.data?.areaHa ?? 0;

  // Filtrar y medir ocurre aqui, sobre los datos ya descargados: mover un
  // deslizador no vuelve a pedir nada al servidor (RF-16).
  const visibles = useMemo(() => filtrarCopas(copas, filtros), [copas, filtros]);
  const metricas = useMemo(
    () => calcularMetricas(copas, filtros, areaHa),
    [copas, filtros, areaHa],
  );

  const seleccionada = visibles.find((c) => c.id === seleccionadaId) ?? null;

  const estados = useMemo(
    () => new Set(visibles.map((copa) => estadoDeCopa(copa))),
    [visibles],
  );

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
          <PanelMetricas metricas={metricas} areaHa={areaHa} />

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
                  copas={visibles}
                  seleccionadaId={seleccionadaId}
                  onSeleccionar={setSeleccionadaId}
                />
              </MapaBase>

              <Simbologia presentes={estados} />
            </div>

            <div className="space-y-4">
              <PanelFiltros metricas={metricas} />
              <PanelDetalle
                copa={seleccionada}
                urlImagen={ortomosaico.data.urlCog}
                extension={ortomosaico.data.extension}
              />
            </div>
          </div>

          {ortomosaico.data.validacion.mensajes.length > 0 ? (
            <Alert>
              <ImageOff aria-hidden />
              <AlertTitle>La imagen de fondo es un sustituto</AlertTitle>
              <AlertDescription>
                No hay imagen real: el fondo es una simulacion generada con
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
