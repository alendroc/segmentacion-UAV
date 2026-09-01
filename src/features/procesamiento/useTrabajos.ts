import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelarTrabajo,
  iniciarInferencia,
  listarTrabajos,
} from "@/api/endpoints";
import type { ParametrosInferencia, TrabajoInferencia } from "@/api/types";
import { claveProyectos } from "@/features/proyectos/useProyectos";

export function claveTrabajos(proyectoId: string) {
  return ["trabajos", proyectoId] as const;
}

const ESTADOS_FINALES = new Set(["completado", "fallido", "cancelado"]);

export function esFinal(trabajo: TrabajoInferencia): boolean {
  return ESTADOS_FINALES.has(trabajo.estado);
}

/**
 * Sondeo del avance (RF-06 a RF-12).
 *
 * El intervalo se apaga solo cuando el trabajo llega a un estado final: si no,
 * la aplicacion seguiria pidiendo para siempre. La consulta vive en la cache de
 * TanStack Query, asi que se puede navegar a otra pantalla y volver sin perder
 * el seguimiento, que es el criterio 4 de la Fase 8.
 */
export function useTrabajos(proyectoId: string) {
  return useQuery<TrabajoInferencia[]>({
    queryKey: claveTrabajos(proyectoId),
    queryFn: () => listarTrabajos(proyectoId),
    enabled: proyectoId.length > 0,
    refetchInterval: (consulta) => {
      const trabajos = consulta.state.data;
      if (!trabajos || trabajos.length === 0) return false;
      return trabajos.some((t) => !esFinal(t)) ? 1000 : false;
    },
  });
}

export function useIniciarInferencia(proyectoId: string) {
  const cliente = useQueryClient();

  return useMutation<TrabajoInferencia, Error, ParametrosInferencia>({
    mutationFn: (parametros) => iniciarInferencia(proyectoId, parametros),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveTrabajos(proyectoId) });
      void cliente.invalidateQueries({ queryKey: claveProyectos });
    },
  });
}

export function useCancelarTrabajo(proyectoId: string) {
  const cliente = useQueryClient();

  return useMutation<TrabajoInferencia, Error, string>({
    mutationFn: (trabajoId) => cancelarTrabajo(proyectoId, trabajoId),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveTrabajos(proyectoId) });
      void cliente.invalidateQueries({ queryKey: claveProyectos });
    },
  });
}
