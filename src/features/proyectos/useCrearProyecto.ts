import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crearProyecto } from "@/api/endpoints";
import type { NuevoProyecto, Proyecto } from "@/api/types";
import { claveProyectos } from "@/features/proyectos/useProyectos";

/**
 * Crea un proyecto y refresca la lista (RF-01).
 *
 * No se hace actualizacion optimista: el identificador lo asigna el servidor y
 * mostrar uno inventado que luego cambia es peor que esperar la respuesta.
 */
export function useCrearProyecto() {
  const cliente = useQueryClient();

  return useMutation<Proyecto, Error, NuevoProyecto>({
    mutationFn: crearProyecto,
    onSuccess: (proyecto) => {
      cliente.setQueryData<Proyecto[]>(claveProyectos, (previos) =>
        previos ? [proyecto, ...previos] : [proyecto],
      );
      void cliente.invalidateQueries({ queryKey: claveProyectos });
    },
  });
}
