import { useParams } from "react-router-dom";
import { AccionesDePaso } from "@/components/layout/AccionesDePaso";
import { PantallaPendiente } from "@/components/layout/PantallaPendiente";

export function ExportacionPage() {
  const { proyectoId = "" } = useParams<{ proyectoId: string }>();

  return (
    <section className="space-y-4">
      <PantallaPendiente
        titulo="Exportacion"
        fase="Fase 8"
        requerimientos="RF-23 a RF-25: GeoJSON y CSV en el cliente; GeoPackage y reporte PDF deshabilitados"
      />
      <AccionesDePaso proyectoId={proyectoId} paso="exportacion" />
    </section>
  );
}
