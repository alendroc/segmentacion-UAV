import { Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

/**
 * Formatos que son responsabilidad del back end. Se muestran deshabilitados,
 * con el motivo, en vez de esconderlos: forma parte de comunicar el alcance
 * real del prototipo (CLAUDE.md §9). No se simula su descarga.
 */
const NO_DISPONIBLES = [
  {
    nombre: "GeoPackage",
    motivo: "Es una base SQLite; se genera en el servidor.",
  },
  {
    nombre: "Reporte PDF",
    motivo: "Se compone en el servidor con las figuras del analisis.",
  },
];

export function FormatosNoDisponibles() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No disponibles todavia</CardTitle>
        <CardDescription>
          Son responsabilidad del back end, que aun no existe. No se simula su
          descarga.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {NO_DISPONIBLES.map((f) => (
            <li key={f.nombre} className="flex items-start gap-2">
              <Lock
                aria-hidden
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {f.nombre}
                </p>
                <p className="text-xs text-muted-foreground">{f.motivo}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
