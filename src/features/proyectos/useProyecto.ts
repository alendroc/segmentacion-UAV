import { useQuery } from "@tanstack/react-query";
import { obtenerProyecto } from "@/api/endpoints";
import type { Proyecto } from "@/api/types";

export function claveProyecto(proyectoId: string) {
  return ["proyecto", proyectoId] as const;
}

export function useProyecto(proyectoId: string) {
  return useQuery<Proyecto>({
    queryKey: claveProyecto(proyectoId),
    queryFn: () => obtenerProyecto(proyectoId),
    enabled: proyectoId.length > 0,
  });
}
