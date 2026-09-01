import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/uiStore";

export function AlternarTema() {
  const tema = useUiStore((estado) => estado.tema);
  const alternarTema = useUiStore((estado) => estado.alternarTema);

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
