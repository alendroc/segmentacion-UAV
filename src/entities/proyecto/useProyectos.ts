import { useQuery } from "@tanstack/react-query";
import { listarProyectos } from "@/shared/api/endpoints";
import { claveProyectos } from "@/shared/api/claves";
import type { Proyecto } from "@/shared/api/types";

export function useProyectos() {
  return useQuery<Proyecto[]>({
    queryKey: claveProyectos,
    queryFn: listarProyectos,
  });
}
