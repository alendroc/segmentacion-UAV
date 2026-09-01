import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Miga {
  etiqueta: string;
  /** Sin `a` la miga es el lugar donde se esta: texto, no enlace. */
  a?: string;
}

/**
 * Migas de pan. La primera siempre lleva a la lista de proyectos: es el camino
 * de vuelta al inicio desde cualquier punto del flujo.
 */
export function MigasDePan({ migas }: { migas: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegacion">
      <ol className="flex items-center gap-1 text-sm">
        {migas.map((miga, i) => {
          const ultima = i === migas.length - 1;
          return (
            <li key={miga.etiqueta} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                />
              ) : null}
              {miga.a && !ultima ? (
                <Link
                  to={miga.a}
                  className="rounded-sm px-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {miga.etiqueta}
                </Link>
              ) : (
                <span
                  className="px-0.5 font-medium"
                  aria-current={ultima ? "page" : undefined}
                >
                  {miga.etiqueta}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
