import { AlertTriangle, Check, TriangleAlert } from "lucide-react";
import { useParams } from "react-router-dom";
import type { MetadatosVuelo, ResultadoValidacion } from "@/api/types";
import { AccionesDePaso } from "@/components/layout/AccionesDePaso";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrtomosaico } from "@/features/visor/useOrtomosaico";
import { formatearBytes } from "@/lib/formato";

function Comprobacion({
  etiqueta,
  resultado,
  detalle,
}: {
  etiqueta: string;
  resultado: ResultadoValidacion;
  detalle: string;
}) {
  const icono =
    resultado === "valido" ? (
      <Check aria-hidden className="size-4 text-primary" />
    ) : (
      <TriangleAlert aria-hidden className="size-4 text-copa-confianza-baja" />
    );

  return (
    <li className="flex items-start gap-2 py-2">
      <span className="mt-0.5">{icono}</span>
      <div>
        <p className="text-sm font-medium">{etiqueta}</p>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </div>
    </li>
  );
}

function FichaVuelo({ vuelo }: { vuelo: MetadatosVuelo }) {
  const filas: [string, string][] = [
    ["Camara", vuelo.camara],
    ["Distancia focal", `${vuelo.distanciaFocalMm} mm`],
    ["Altura sobre el terreno", `${vuelo.alturaVueloM.toFixed(1)} m`],
    [
      "Posicion",
      `${vuelo.latitud.toFixed(6)} N, ${Math.abs(vuelo.longitud).toFixed(6)} O`,
    ],
    ["Resolucion del fotograma", `${vuelo.gsdCmPorPixel} cm/pixel`],
    ["Huella en el suelo", `${vuelo.huellaM[0]} x ${vuelo.huellaM[1]} m`],
  ];

  return (
    <dl className="divide-y divide-border">
      {filas.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 py-2">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="text-right text-sm tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CargaPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();
  const { data: ortomosaico, isPending, isError, error } = useOrtomosaico(proyectoId);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Carga del ortomosaico
        </h1>
        <p className="text-sm text-muted-foreground">
          El insumo del analisis y el resultado de validarlo.
        </p>
      </header>

      {isPending ? <Skeleton className="h-80 w-full rounded-lg" /> : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>Este proyecto no tiene ortomosaico</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {ortomosaico ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  Fotograma del vuelo
                  <Badge variant="secondary">Imagen real</Badge>
                </CardTitle>
                <CardDescription>
                  Toma nadir del levantamiento. Es el insumo del que se compone
                  el ortomosaico.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ortomosaico.vuelo ? (
                  <>
                    <img
                      src={ortomosaico.vuelo.urlFotograma}
                      alt="Fotograma nadir del vuelo sobre bosque tropical seco: copas verdes, arbolado caducifolio sin hoja y suelo descubierto."
                      className="w-full rounded-md border"
                      loading="lazy"
                    />
                    <FichaVuelo vuelo={ortomosaico.vuelo} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin fotogramas de referencia para este vuelo.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validacion del archivo</CardTitle>
                <CardDescription>
                  {ortomosaico.nombreArchivo} ·{" "}
                  {formatearBytes(ortomosaico.tamanoBytes)} ·{" "}
                  {ortomosaico.formato}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="divide-y divide-border">
                  <Comprobacion
                    etiqueta="Formato"
                    resultado={ortomosaico.validacion.formato}
                    detalle={`${ortomosaico.formato}, legible por rangos HTTP`}
                  />
                  <Comprobacion
                    etiqueta="Sistema de referencia"
                    resultado={ortomosaico.validacion.crs}
                    detalle={`${ortomosaico.crs} — CR05 / CRTM05, el oficial de Costa Rica`}
                  />
                  <Comprobacion
                    etiqueta="Resolucion"
                    resultado={ortomosaico.validacion.resolucion}
                    detalle={`${ortomosaico.resolucionCmPorPixel} cm/pixel, suficiente para delimitar copas`}
                  />
                </ul>

                {ortomosaico.validacion.mensajes.length > 0 ? (
                  <Alert>
                    <TriangleAlert aria-hidden />
                    <AlertTitle>Advertencias</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc space-y-1 pl-4">
                        {ortomosaico.validacion.mensajes.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <AccionesDePaso proyectoId={proyectoId} paso="carga" />
        </>
      ) : null}
    </section>
  );
}
