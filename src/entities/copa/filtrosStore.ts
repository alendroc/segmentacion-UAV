/**
 * Filtros del visor. Ocultan copas; nunca las modifican. La herramienta activa
 * y el historial de deshacer llegan en la Fase 6.
 */
import { create } from "zustand";
import { FILTROS_INICIALES, type Filtros } from "./metricas";

interface EstadoFiltros {
  filtros: Filtros;
  fijarFiltro: <C extends keyof Filtros>(clave: C, valor: Filtros[C]) => void;
  restaurarFiltros: () => void;
}

export const useFiltrosStore = create<EstadoFiltros>((set) => ({
  filtros: FILTROS_INICIALES,
  fijarFiltro: (clave, valor) =>
    set((estado) => ({ filtros: { ...estado.filtros, [clave]: valor } })),
  restaurarFiltros: () => set({ filtros: FILTROS_INICIALES }),
}));
