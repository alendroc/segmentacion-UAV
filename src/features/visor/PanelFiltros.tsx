import { RotateCcw } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { sonFiltrosIniciales, type Metricas } from "@/features/visor/metricas";
import { formatearEntero } from "@/lib/formato";
import { useUiStore } from "@/store/uiStore";

/** Area maxima que ofrece el deslizador. Las copas del lote no pasan de 47 m². */
const AREA_MAXIMA = 50;

export function PanelFiltros({ metricas }: { metricas: Metricas }) {
  const filtros = useUiStore((e) => e.filtros);
  const fijarFiltro = useUiStore((e) => e.fijarFiltro);
  const restaurarFiltros = useUiStore((e) => e.restaurarFiltros);

  const idConfianza = useId();
  const idArea = useId();
  const sinTocar = sonFiltrosIniciales(filtros);

  return (
    <div className="space-y-4 rounded-lg border p-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-semibold tracking-tight">
          Filtros
        </h2>
        <Button
          variant="ghost"
          size="xs"
          onClick={restaurarFiltros}
          disabled={sinTocar}
        >
          <RotateCcw aria-hidden />
          Restaurar
        </Button>
      </header>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={idConfianza} className="text-xs font-normal">
            Confianza minima
          </Label>
          <span className="text-xs tabular-nums">
            {(filtros.confianzaMinima * 100).toFixed(0)} %
          </span>
        </div>
        <Slider
          id={idConfianza}
          min={0}
          max={99}
          step={1}
          value={[Math.round(filtros.confianzaMinima * 100)]}
          onValueChange={([v]) => fijarFiltro("confianzaMinima", v / 100)}
          aria-label="Confianza minima del modelo"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={idArea} className="text-xs font-normal">
            Area minima de copa
          </Label>
          <span className="text-xs tabular-nums">
            {filtros.areaMinima.toFixed(1).replace(".", ",")} m²
          </span>
        </div>
        <Slider
          id={idArea}
          min={0}
          max={AREA_MAXIMA * 2}
          step={1}
          value={[Math.round(filtros.areaMinima * 2)]}
          onValueChange={([v]) => fijarFiltro("areaMinima", v / 2)}
          aria-label="Area minima de copa en metros cuadrados"
        />
      </div>

      <p
        className="text-xs text-muted-foreground"
        aria-live="polite"
        role="status"
      >
        {metricas.ocultas > 0
          ? `${formatearEntero(metricas.ocultas)} copas ocultas por los filtros. Siguen registradas: los filtros ocultan, no borran.`
          : "Los filtros ocultan, no borran. Ninguna copa esta oculta ahora."}
      </p>
    </div>
  );
}
