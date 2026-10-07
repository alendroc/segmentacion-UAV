/**
 * Preferencia de tema claro/oscuro. No guarda datos del servidor: de eso se
 * encarga TanStack Query.
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

interface EstadoTema {
  tema: Tema;
  alternarTema: () => void;
}

export const useTemaStore = create<EstadoTema>((set, get) => ({
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
  aplicarTema(useTemaStore.getState().tema);
}
