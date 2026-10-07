import Map from "ol/Map";
import { createContext, useContext } from "react";

/**
 * Instancia de OpenLayers que `MapaBase` comparte con sus capas hijas.
 * Vive aparte del componente para no romper la recarga en caliente.
 */
export const ContextoMapa = createContext<Map | null>(null);

export function useMapa(): Map | null {
  return useContext(ContextoMapa);
}
