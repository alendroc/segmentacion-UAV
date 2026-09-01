import { motion } from "motion/react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { AlternarTema } from "@/components/layout/AlternarTema";
import { AvisoSimulacion } from "@/components/layout/AvisoSimulacion";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMovimientoReducido } from "@/hooks/useMovimientoReducido";

interface Enlace {
  ruta: string;
  etiqueta: string;
}

function enlacesDelProyecto(proyectoId: string): Enlace[] {
  return [
    { ruta: `/proyectos/${proyectoId}/carga`, etiqueta: "Carga" },
    { ruta: `/proyectos/${proyectoId}/procesamiento`, etiqueta: "Procesamiento" },
    { ruta: `/proyectos/${proyectoId}/visor`, etiqueta: "Visor" },
    { ruta: `/proyectos/${proyectoId}/exportacion`, etiqueta: "Exportacion" },
  ];
}

export function Shell() {
  const { proyectoId } = useParams<{ proyectoId: string }>();
  const ubicacion = useLocation();
  const sinMovimiento = useMovimientoReducido();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AvisoSimulacion />

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-3 px-4">
          <NavLink
            to="/proyectos"
            className="font-heading text-sm font-semibold tracking-tight"
          >
            Copas UAV
            <span className="ml-2 font-normal text-muted-foreground">
              Bosque tropical seco, Chorotega
            </span>
          </NavLink>

          {proyectoId ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <nav aria-label="Secciones del proyecto" className="flex gap-0.5">
                {enlacesDelProyecto(proyectoId).map((enlace) => (
                  <NavLink
                    key={enlace.ruta}
                    to={enlace.ruta}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    {enlace.etiqueta}
                  </NavLink>
                ))}
              </nav>
            </>
          ) : null}

          <div className="ml-auto">
            <AlternarTema />
          </div>
        </div>
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
