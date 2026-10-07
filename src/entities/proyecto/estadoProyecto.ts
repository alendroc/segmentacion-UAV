import type { EstadoProyecto } from "@/shared/api/types";

type VarianteInsignia = "default" | "secondary" | "destructive" | "outline";

interface DescripcionEstado {
  etiqueta: string;
  variante: VarianteInsignia;
}

const ESTADOS: Record<EstadoProyecto, DescripcionEstado> = {
  sin_ortomosaico: { etiqueta: "Sin imagen", variante: "outline" },
  ortomosaico_cargado: { etiqueta: "Listo para procesar", variante: "secondary" },
  procesando: { etiqueta: "En proceso", variante: "secondary" },
  completado: { etiqueta: "Completado", variante: "default" },
  error_georreferencia: {
    etiqueta: "Error de georreferencia",
    variante: "destructive",
  },
};

export function describirEstado(estado: EstadoProyecto): DescripcionEstado {
  return ESTADOS[estado];
}
