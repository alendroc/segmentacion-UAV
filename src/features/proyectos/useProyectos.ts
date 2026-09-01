import { useQuery } from "@tanstack/react-query";
import { listarProyectos } from "@/api/endpoints";
import type { Proyecto } from "@/api/types";

export const claveProyectos = ["proyectos"] as const;

export function useProyectos() {
  return useQuery<Proyecto[]>({
    queryKey: claveProyectos,
    queryFn: listarProyectos,
  });
}
