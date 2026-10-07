import { MousePointerSquareDashed } from "lucide-react";
import type { Copa, ExtensionGeografica } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { aparienciaDeCopa } from "@/entities/copa";
import { MiniaturaCopa } from "./MiniaturaCopa";
import {
  formatearArea,
  formatearConfianza,
  formatearCoordenada,
  formatearMetros,
} from "@/shared/lib/formato";

const NOMBRE_ORIGEN: Record<Copa["origen"], string> = {
  automatico: "Detectada por el modelo",
  manual: "Trazada a mano",
  corregido: "Corregida a mano",
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-right text-sm tabular-nums">{valor}</dd>
    </div>
  );
}

export interface PropsPanelDetalle {
  copa: Copa | null;
  urlImagen: string;
  extension: ExtensionGeografica;
}

/** Atributos de la copa seleccionada (RF-15, RF-17, RF-22). */
export function PanelDetalle({ copa, urlImagen, extension }: PropsPanelDetalle) {
  if (!copa) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <MousePointerSquareDashed
          aria-hidden
          className="size-6 text-muted-foreground"
        />
        <p className="text-sm font-medium">Ninguna copa seleccionada</p>
        <p className="text-xs text-muted-foreground">
          Haga clic sobre un poligono del mapa para ver la segmentacion de ese
          arbol y sus atributos.
        </p>
      </div>
    );
  }

  const apariencia = aparienciaDeCopa(copa);
  const vertices = copa.geometria.coordinates[0].length - 1;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold tracking-tight">
          {copa.id}
        </h2>
        <Badge
          variant="outline"
          style={{
            borderColor: `var(--${apariencia.token})`,
            color: `var(--${apariencia.token})`,
          }}
        >
          {apariencia.etiqueta}
        </Badge>
      </header>

      <MiniaturaCopa
        copa={copa}
        urlImagen={urlImagen}
        extension={extension}
      />

      <Separator />

      <dl className="divide-y divide-border">
        <Dato
          etiqueta="Confianza del modelo"
          valor={formatearConfianza(copa.confianza)}
        />
        <Dato etiqueta="Area de copa" valor={formatearArea(copa.areaM2)} />
        <Dato
          etiqueta="Diametro equivalente"
          valor={formatearMetros(copa.diametroM)}
        />
        <Dato etiqueta="Vertices del poligono" valor={String(vertices)} />
        <Dato etiqueta="Origen" valor={NOMBRE_ORIGEN[copa.origen]} />
      </dl>

      <div>
        <p className="text-xs text-muted-foreground">Centroide (CRTM05)</p>
        <p className="font-mono text-xs tabular-nums">
          {formatearCoordenada(copa.centroide)}
        </p>
      </div>
    </div>
  );
}
