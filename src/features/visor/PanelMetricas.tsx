import type { Metricas } from "@/features/visor/metricas";
import { formatearArea, formatearEntero, formatearMetros } from "@/lib/formato";

function Metrica({
  etiqueta,
  valor,
  nota,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums">
        {valor}
      </dd>
      {nota ? <p className="text-[11px] text-muted-foreground">{nota}</p> : null}
    </div>
  );
}

/** Metricas agregadas del area de interes (RF-18). Se recalculan en vivo. */
export function PanelMetricas({
  metricas,
  areaHa,
}: {
  metricas: Metricas;
  areaHa: number;
}) {
  const decimal = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

  return (
    <dl className="grid grid-cols-2 gap-4 rounded-lg border p-3 sm:grid-cols-3 lg:grid-cols-5">
      <Metrica
        etiqueta="Copas visibles"
        valor={formatearEntero(metricas.conteo)}
        nota={
          metricas.ocultas > 0
            ? `${formatearEntero(metricas.ocultas)} ocultas`
            : undefined
        }
      />
      <Metrica
        etiqueta="Densidad"
        valor={`${decimal(metricas.densidadPorHa)} /ha`}
        nota={`sobre ${decimal(areaHa, 2)} ha`}
      />
      <Metrica
        etiqueta="Area de copa media"
        valor={formatearArea(metricas.areaMediaM2)}
      />
      <Metrica
        etiqueta="Diametro medio"
        valor={formatearMetros(metricas.diametroMedioM)}
      />
      <Metrica
        etiqueta="Cobertura de dosel"
        valor={`${decimal(metricas.coberturaPct)} %`}
        nota={formatearArea(metricas.areaCopaTotalM2)}
      />
    </dl>
  );
}
