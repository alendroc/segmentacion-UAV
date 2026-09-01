/**
 * Estado de interfaz. No guarda datos del servidor: de eso se encarga
 * TanStack Query.
 *
 * Aqui viven el tema y los filtros del visor. La herramienta activa y el
 * historial de deshacer llegan en la Fase 6.
 */
import { create } from "zustand";
import { FILTROS_INICIALES, type Filtros } from "@/features/visor/metricas";

export type Tema = "claro" | "oscuro";

const CLAVE_TEMA = "ortomosaicos:tema";

function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_TEMA);
  if (guardado === "claro" || guardado === "oscuro") return guardado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "oscuro"
    : "claro";
}

function aplicarTema(tema: Tema): void {
  document.documentElement.classList.toggle("dark", tema === "oscuro");
}

interface EstadoUi {
  tema: Tema;
  alternarTema: () => void;

  /** Filtros del visor. Ocultan copas; nunca las modifican. */
  filtros: Filtros;
  fijarFiltro: <C extends keyof Filtros>(clave: C, valor: Filtros[C]) => void;
  restaurarFiltros: () => void;
}

export const useUiStore = create<EstadoUi>((set, get) => ({
  tema: temaInicial(),
  alternarTema: () => {
    const siguiente: Tema = get().tema === "claro" ? "oscuro" : "claro";
    localStorage.setItem(CLAVE_TEMA, siguiente);
    aplicarTema(siguiente);
    set({ tema: siguiente });
  },

  filtros: FILTROS_INICIALES,
  fijarFiltro: (clave, valor) =>
    set((estado) => ({ filtros: { ...estado.filtros, [clave]: valor } })),
  restaurarFiltros: () => set({ filtros: FILTROS_INICIALES }),
}));

/** Se llama una vez al arrancar, antes de montar React. */
export function inicializarTema(): void {
  aplicarTema(useUiStore.getState().tema);
}
