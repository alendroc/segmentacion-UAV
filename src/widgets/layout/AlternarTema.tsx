import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useTemaStore } from "@/shared/store/temaStore";

export function AlternarTema() {
  const tema = useTemaStore((estado) => estado.tema);
  const alternarTema = useTemaStore((estado) => estado.alternarTema);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={alternarTema}
      aria-label={tema === "claro" ? "Activar tema oscuro" : "Activar tema claro"}
    >
      {tema === "claro" ? <Moon aria-hidden /> : <Sun aria-hidden />}
    </Button>
  );
}
