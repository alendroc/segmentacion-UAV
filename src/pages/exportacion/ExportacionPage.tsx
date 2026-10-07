import { AlertTriangle, Download } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AccionesDePaso } from "@/widgets/layout";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  descargarTexto,
  generarCsv,
  generarGeoJson,
  nombreArchivo,
  type Procedencia,
} from "@/features/exportar-copas";
import { useProyecto } from "@/entities/proyecto";
import {
  calcularMetricas,
  filtrarCopas,
  useCopas,
  useFiltrosStore,
} from "@/entities/copa";
import { useAreaInteres } from "@/entities/ortomosaico";
import { formatearEntero } from "@/shared/lib/formato";
import { Dato } from "./Dato";
import { FormatosNoDisponibles } from "./FormatosNoDisponibles";

export function ExportacionPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();
  const filtros = useFiltrosStore((e) => e.filtros);

  const proyecto = useProyecto(proyectoId);
  const copasQuery = useCopas(proyectoId);
  const areaQuery = useAreaInteres(proyectoId);

  const copas = useMemo(() => copasQuery.data ?? [], [copasQuery.data]);
  const visibles = useMemo(() => filtrarCopas(copas, filtros), [copas, filtros]);
  const metricas = calcularMetricas(copas, filtros, areaQuery.data?.areaHa ?? 0);

  const cargando = proyecto.isPending || copasQuery.isPending;

  function procedencia(): Procedencia | null {
    if (!proyecto.data) return null;
    return {
      proyecto: proyecto.data,
      filtros,
      exportadas: visibles.length,
      totales: copas.length,
      eliminadas: metricas.eliminadas,
      generadoEn: new Date(),
    };
  }

  function exportar(formato: "geojson" | "csv") {
    const p = procedencia();
    if (!p) return;

    const contenido =
      formato === "geojson" ? generarGeoJson(visibles, p) : generarCsv(visibles, p);
    const nombre = nombreArchivo(p.proyecto, formato, p.generadoEn);

    descargarTexto(
      nombre,
      contenido,
      formato === "geojson" ? "application/geo+json" : "text/csv",
    );
    toast.success(`${nombre} descargado`, {
      description: `${formatearEntero(p.exportadas)} de ${formatearEntero(p.totales)} copas.`,
    });
  }

  // Cinco filas: no vale la pena memorizarlo, y memorizarlo obligaria a repetir
  // aqui las dependencias de `procedencia()`.
  const p = procedencia();
  const vistaPrevia =
    p && visibles.length > 0
      ? generarCsv(visibles.slice(0, 5), p)
          .replace("﻿", "")
          .split("\r\n")
          .filter((linea) => !linea.startsWith("#"))
          .join("\n")
      : "";

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Exportacion
        </h1>
        <p className="text-sm text-muted-foreground">
          Se exporta unicamente lo visible con los filtros activos, y el archivo
          declara cuantas de cuantas salieron.
        </p>
      </header>

      {cargando ? <Skeleton className="h-72 w-full rounded-lg" /> : null}

      {proyecto.data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Que se va a exportar</CardTitle>
                <CardDescription>
                  Procedencia que acompana a cada archivo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="divide-y divide-border">
                  <Dato etiqueta="Proyecto" valor={proyecto.data.nombre} />
                  <Dato
                    etiqueta="Copas a exportar"
                    valor={`${formatearEntero(visibles.length)} de ${formatearEntero(copas.length)}`}
                  />
                  <Dato
                    etiqueta="Ocultas por los filtros"
                    valor={formatearEntero(metricas.ocultas)}
                  />
                  <Dato
                    etiqueta="Descartadas (borrado logico)"
                    valor={formatearEntero(metricas.eliminadas)}
                  />
                  <Dato
                    etiqueta="Confianza minima"
                    valor={`${(filtros.confianzaMinima * 100).toFixed(0)} %`}
                  />
                  <Dato
                    etiqueta="Area minima"
                    valor={`${filtros.areaMinima.toFixed(1).replace(".", ",")} m²`}
                  />
                  <Dato etiqueta="Sistema de referencia" valor="EPSG:5367" />
                </dl>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => exportar("geojson")}
                    disabled={visibles.length === 0}
                  >
                    <Download aria-hidden />
                    GeoJSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportar("csv")}
                    disabled={visibles.length === 0}
                  >
                    <Download aria-hidden />
                    CSV de atributos
                  </Button>
                </div>

                {visibles.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertTriangle aria-hidden />
                    <AlertDescription>
                      Los filtros activos no dejan ninguna copa visible. No hay
                      nada que exportar.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vista previa del CSV</CardTitle>
                  <CardDescription>
                    Primeras filas, con punto y coma y coma decimal para Excel en
                    espanol.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
                    {vistaPrevia || "Sin copas que mostrar."}
                  </pre>
                </CardContent>
              </Card>

              <FormatosNoDisponibles />
            </div>
          </div>

          <Alert>
            <AlertTitle>Los archivos declaran que son simulados</AlertTitle>
            <AlertDescription>
              Tanto el GeoJSON como el CSV llevan un bloque de procedencia con el
              proyecto, la fecha, el CRS, los filtros aplicados, cuantas copas de
              cuantas salieron y el aviso de que no hay ningun modelo detras.
            </AlertDescription>
          </Alert>

          <AccionesDePaso proyectoId={proyectoId} paso="exportacion" />
        </>
      ) : null}
    </section>
  );
}
