import { useQuery } from "@tanstack/react-query";
import { listarCopas } from "@/shared/api/endpoints";
import type { Copa } from "@/shared/api/types";

export function claveCopas(proyectoId: string) {
  return ["copas", proyectoId] as const;
}

export function useCopas(proyectoId: string) {
  return useQuery<Copa[]>({
    queryKey: claveCopas(proyectoId),
    queryFn: () => listarCopas(proyectoId),
    enabled: proyectoId.length > 0,
  });
}
