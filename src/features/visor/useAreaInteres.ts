import { useQuery } from "@tanstack/react-query";
import { obtenerAreaInteres } from "@/api/endpoints";
import type { AreaInteres } from "@/api/types";

export function claveAreaInteres(proyectoId: string) {
  return ["area-interes", proyectoId] as const;
}

export function useAreaInteres(proyectoId: string) {
  return useQuery<AreaInteres>({
    queryKey: claveAreaInteres(proyectoId),
    queryFn: () => obtenerAreaInteres(proyectoId),
    enabled: proyectoId.length > 0,
  });
}
