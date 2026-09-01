import { motion } from "motion/react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { AlternarTema } from "@/components/layout/AlternarTema";
import { AvisoSimulacion } from "@/components/layout/AvisoSimulacion";
import { MigasDePan, type Miga } from "@/components/layout/MigasDePan";
import { useProyecto } from "@/features/proyectos/useProyecto";
import { useMovimientoReducido } from "@/hooks/useMovimientoReducido";
import { cn } from "@/lib/utils";
import { PASOS, pasoDesdeRuta, rutaDePaso } from "@/lib/pasos";

function NavegacionDePasos({ proyectoId }: { proyectoId: string }) {
  return (
    <nav
      aria-label="Pasos del flujo de trabajo"
      className="flex items-center gap-1 overflow-x-auto"
    >
      {PASOS.map((paso) => (
        <NavLink
          key={paso.clave}
          to={rutaDePaso(proyectoId, paso.clave)}
          title={paso.proposito}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden
                className={cn(
                  "grid size-4.5 place-items-center rounded-full text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground",
                )}
              >
                {paso.numero}
              </span>
              {paso.etiqueta}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Shell() {
  const { proyectoId } = useParams<{ proyectoId: string }>();
  const ubicacion = useLocation();
  const sinMovimiento = useMovimientoReducido();
  const { data: proyecto } = useProyecto(proyectoId ?? "");

  const paso = pasoDesdeRuta(ubicacion.pathname);

  const migas: Miga[] = [{ etiqueta: "Proyectos", a: "/proyectos" }];
  if (proyectoId) {
    migas.push({
      etiqueta: proyecto?.nombre ?? proyectoId,
      a: rutaDePaso(proyectoId, "visor"),
    });
    if (paso) migas.push({ etiqueta: paso.etiqueta });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AvisoSimulacion />

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-3 px-4">
          <NavLink
            to="/proyectos"
            className="shrink-0 rounded-sm font-heading text-sm font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Copas UAV
          </NavLink>
          <span aria-hidden className="text-muted-foreground/40">
            |
          </span>
          <MigasDePan migas={migas} />
          <div className="ml-auto shrink-0">
            <AlternarTema />
          </div>
        </div>

        {proyectoId ? (
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 border-t border-border/60 px-4 py-1.5">
            <NavegacionDePasos proyectoId={proyectoId} />
            {paso ? (
              <p className="ml-auto hidden shrink-0 text-xs text-muted-foreground lg:block">
                Paso {paso.numero} de {PASOS.length} · {paso.proposito}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      <motion.main
        key={ubicacion.pathname}
        initial={sinMovimiento ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
