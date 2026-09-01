import type { EntradaBitacora, NivelBitacora } from "@/api/types";

const COLOR: Record<NivelBitacora, string> = {
  info: "text-muted-foreground",
  advertencia: "text-copa-confianza-baja",
  error: "text-destructive",
};

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Registro de lo que hizo el trabajo. Es el material que va al anexo. */
export function Bitacora({ entradas }: { entradas: EntradaBitacora[] }) {
  if (entradas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        La bitacora se llena cuando el trabajo arranca.
      </p>
    );
  }

  return (
    <ol className="max-h-56 space-y-1 overflow-y-auto rounded-md border bg-muted/40 p-2 font-mono text-xs">
      {entradas.map((entrada, i) => (
        <li key={`${entrada.momento}-${i}`} className="flex gap-2">
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {hora(entrada.momento)}
          </span>
          <span className={COLOR[entrada.nivel]}>{entrada.mensaje}</span>
        </li>
      ))}
    </ol>
  );
}
