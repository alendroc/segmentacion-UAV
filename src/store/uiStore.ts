/**
 * Estado de interfaz. No guarda datos del servidor: de eso se encarga
 * TanStack Query.
 *
 * En la Fase 1 solo vive el tema. La herramienta activa, los filtros y el
 * historial de deshacer llegan en las Fases 5 y 6.
 */
import { create } from "zustand";

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
}

export const useUiStore = create<EstadoUi>((set, get) => ({
  tema: temaInicial(),
  alternarTema: () => {
    const siguiente: Tema = get().tema === "claro" ? "oscuro" : "claro";
    localStorage.setItem(CLAVE_TEMA, siguiente);
    aplicarTema(siguiente);
    set({ tema: siguiente });
  },
}));

/** Se llama una vez al arrancar, antes de montar React. */
export function inicializarTema(): void {
  aplicarTema(useUiStore.getState().tema);
}
