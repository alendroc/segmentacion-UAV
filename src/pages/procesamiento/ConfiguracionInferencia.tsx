import { AlertTriangle, Play } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import {
  PARAMETROS_POR_DEFECTO,
  type ParametrosInferencia,
} from "@/shared/api/types";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

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

export function ConfiguracionInferencia({
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
          ayuda="La imagen no cabe en memoria: se recorta y se procesa por partes."
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
