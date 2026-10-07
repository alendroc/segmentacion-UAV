import { describe, expect, it } from "vitest";
import type { Copa } from "@/shared/api/types";
import {
  APARIENCIAS,
  estadoDeCopa,
  UMBRAL_CONFIANZA_BAJA,
} from "./estilosCopa";

function copa(parcial: Partial<Copa>): Copa {
  return {
    id: "co-001",
    proyectoId: "pr-001",
    geometria: { type: "Polygon", coordinates: [[]] },
    confianza: 0.9,
    areaM2: 20,
    diametroM: 5,
    centroide: [340_900, 1_122_100],
    origen: "automatico",
    eliminada: false,
    ...parcial,
  };
}

describe("estado de una copa", () => {
  it("una deteccion automatica con confianza alta es automatica", () => {
    expect(estadoDeCopa(copa({}))).toBe("automatica");
  });

  it("por debajo del umbral es de confianza baja", () => {
    expect(estadoDeCopa(copa({ confianza: UMBRAL_CONFIANZA_BAJA - 0.01 }))).toBe(
      "confianza-baja",
    );
  });

  it("el origen manda sobre la confianza", () => {
    expect(estadoDeCopa(copa({ origen: "manual", confianza: null }))).toBe(
      "manual",
    );
    expect(estadoDeCopa(copa({ origen: "corregido", confianza: 0.2 }))).toBe(
      "corregida",
    );
  });

  it("el borrado logico manda sobre todo lo demas", () => {
    expect(estadoDeCopa(copa({ eliminada: true, origen: "manual" }))).toBe(
      "eliminada",
    );
  });

  /*
   * CLAUDE.md §6 ter: la distincion no puede apoyarse solo en el color. Cada
   * estado que no sea el normal tiene que separarse ademas por trazo u opacidad.
   */
  it("distingue cada estado sin depender solo del color", () => {
    const señas = Object.entries(APARIENCIAS).map(
      ([clave, a]) => `${clave}:${a.discontinuo}:${a.opacidad}`,
    );
    expect(new Set(señas).size).toBe(señas.length);
    expect(APARIENCIAS["confianza-baja"].discontinuo).toBe(true);
    expect(APARIENCIAS.eliminada.opacidad).toBeLessThan(1);
  });
});
