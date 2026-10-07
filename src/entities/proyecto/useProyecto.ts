import { useQuery } from "@tanstack/react-query";
import { obtenerProyecto } from "@/shared/api/endpoints";
import { claveProyecto } from "@/shared/api/claves";
import type { Proyecto } from "@/shared/api/types";

export function useProyecto(proyectoId: string) {
  return useQuery<Proyecto>({
    queryKey: claveProyecto(proyectoId),
    queryFn: () => obtenerProyecto(proyectoId),
    enabled: proyectoId.length > 0,
  });
}
