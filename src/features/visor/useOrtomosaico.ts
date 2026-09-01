import { useQuery } from "@tanstack/react-query";
import { obtenerOrtomosaico } from "@/api/endpoints";
import type { Ortomosaico } from "@/api/types";

export function claveOrtomosaico(proyectoId: string) {
  return ["ortomosaico", proyectoId] as const;
}

export function useOrtomosaico(proyectoId: string) {
  return useQuery<Ortomosaico>({
    queryKey: claveOrtomosaico(proyectoId),
    queryFn: () => obtenerOrtomosaico(proyectoId),
  });
}
