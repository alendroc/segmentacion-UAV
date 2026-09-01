import { Construction } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  titulo: string;
  fase: string;
  requerimientos: string;
}

/** Marcador de pantalla cuya fase todavia no se ha construido. */
export function PantallaPendiente({ titulo, fase, requerimientos }: Props) {
  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        {titulo}
      </h1>
      <Alert>
        <Construction aria-hidden />
        <AlertTitle>Pendiente de construccion</AlertTitle>
        <AlertDescription>
          Esta pantalla se construye en la {fase}. Cubre {requerimientos}. La
          ruta ya existe para verificar el enrutamiento de la Fase 1.
        </AlertDescription>
      </Alert>
    </section>
  );
}
