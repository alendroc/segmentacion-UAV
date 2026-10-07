export function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-right text-sm tabular-nums">{valor}</dd>
    </div>
  );
}
