import { useParams } from "react-router-dom";
import { AccionesDePaso } from "@/components/layout/AccionesDePaso";
import { PantallaPendiente } from "@/components/layout/PantallaPendiente";

export function ProcesamientoPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();

  return (
    <section className="space-y-4">
      <PantallaPendiente
        titulo="Procesamiento"
        fase="Fase 8"
        requerimientos="RF-06 a RF-12: sondeo del trabajo de inferencia, barra de progreso y bitacora"
      />
      <AccionesDePaso proyectoId={proyectoId} paso="procesamiento" />
    </section>
  );
}
