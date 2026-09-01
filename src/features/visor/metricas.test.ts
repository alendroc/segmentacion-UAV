import { describe, expect, it } from "vitest";
import type { Copa } from "@/api/types";
import {
  calcularMetricas,
  copaVisible,
  filtrarCopas,
  FILTROS_INICIALES,
  sonFiltrosIniciales,
  type Filtros,
} from "@/features/visor/metricas";

function copa(parcial: Partial<Copa> & { id: string }): Copa {
  return {
    proyectoId: "pr-001",
    geometria: { type: "Polygon", coordinates: [[]] },
    confianza: 0.9,
    areaM2: 20,
    diametroM: 5.05,
    centroide: [340_900, 1_122_100],
    origen: "automatico",
    eliminada: false,
    ...parcial,
  };
}

const LOTE: Copa[] = [
  copa({ id: "a", confianza: 0.95, areaM2: 30, diametroM: 6.18 }),
  copa({ id: "b", confianza: 0.8, areaM2: 20, diametroM: 5.05 }),
  copa({ id: "c", confianza: 0.4, areaM2: 12, diametroM: 3.91 }),
  copa({ id: "d", confianza: null, origen: "manual", areaM2: 10, diametroM: 3.57 }),
  copa({ id: "e", confianza: 0.9, areaM2: 25, eliminada: true }),
];

function con(parcial: Partial<Filtros>): Filtros {
  return { ...FILTROS_INICIALES, ...parcial };
}

describe("filtros", () => {
  it("sin filtros muestra todo salvo lo eliminado", () => {
    expect(filtrarCopas(LOTE, FILTROS_INICIALES).map((c) => c.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("el borrado logico no es un filtro: nunca se muestra", () => {
    expect(copaVisible(LOTE[4], FILTROS_INICIALES)).toBe(false);
  });

  it("oculta por debajo de la confianza minima", () => {
    const ids = filtrarCopas(LOTE, con({ confianzaMinima: 0.5 })).map(
      (c) => c.id,
    );
    expect(ids).not.toContain("c");
    expect(ids).toContain("b");
  });

  /*
   * Decision de dominio: el umbral mide al modelo. Una copa trazada a mano no
   * tiene nota del modelo, y ocultarla por eso castigaria el trabajo de
   * correccion que la interfaz existe para permitir.
   */
  it("nunca oculta una copa sin confianza por el filtro de confianza", () => {
    const ids = filtrarCopas(LOTE, con({ confianzaMinima: 0.99 })).map(
      (c) => c.id,
    );
    expect(ids).toEqual(["d"]);
  });

  it("oculta por debajo del area minima", () => {
    const ids = filtrarCopas(LOTE, con({ areaMinima: 15 })).map((c) => c.id);
    expect(ids).toEqual(["a", "b"]);
  });

  /* Criterio 3 de la Fase 5. */
  it("restaurar los filtros devuelve exactamente el conteo original", () => {
    const original = calcularMetricas(LOTE, FILTROS_INICIALES, 1.2).conteo;
    const filtrado = calcularMetricas(
      LOTE,
      con({ confianzaMinima: 0.85, areaMinima: 22 }),
      1.2,
    ).conteo;
    const restaurado = calcularMetricas(LOTE, FILTROS_INICIALES, 1.2).conteo;

    expect(filtrado).toBeLessThan(original);
    expect(restaurado).toBe(original);
  });

  it("reconoce los filtros sin tocar", () => {
    expect(sonFiltrosIniciales(FILTROS_INICIALES)).toBe(true);
    expect(sonFiltrosIniciales(con({ areaMinima: 3 }))).toBe(false);
  });

  it("los filtros no modifican las copas", () => {
    const copia = structuredClone(LOTE);
    filtrarCopas(LOTE, con({ confianzaMinima: 0.9, areaMinima: 40 }));
    expect(LOTE).toEqual(copia);
  });
});

describe("metricas agregadas", () => {
  /* Criterio 2 de la Fase 5. */
  it("la densidad es el conteo visible entre la superficie del area", () => {
    const m = calcularMetricas(LOTE, FILTROS_INICIALES, 1.2);
    expect(m.conteo).toBe(4);
    expect(m.densidadPorHa).toBeCloseTo(4 / 1.2, 10);
  });

  it("cuenta por separado lo oculto y lo eliminado", () => {
    const m = calcularMetricas(LOTE, con({ areaMinima: 15 }), 1.2);
    expect(m.conteo).toBe(2); // a, b
    expect(m.ocultas).toBe(2); // c, d
    expect(m.eliminadas).toBe(1); // e
    expect(m.conteo + m.ocultas + m.eliminadas).toBe(LOTE.length);
  });

  it("promedia area y diametro solo sobre lo visible", () => {
    const m = calcularMetricas(LOTE, con({ areaMinima: 15 }), 1.2);
    expect(m.areaCopaTotalM2).toBe(50);
    expect(m.areaMediaM2).toBe(25);
    expect(m.diametroMedioM).toBeCloseTo((6.18 + 5.05) / 2, 10);
  });

  it("la cobertura es area de copa sobre superficie del area de interes", () => {
    const m = calcularMetricas(LOTE, FILTROS_INICIALES, 1.2);
    // 30 + 20 + 12 + 10 = 72 m2 sobre 12 000 m2.
    expect(m.areaCopaTotalM2).toBe(72);
    expect(m.coberturaPct).toBeCloseTo((72 / 12_000) * 100, 10);
  });

  it("no divide por cero cuando no hay area ni copas visibles", () => {
    const m = calcularMetricas([], FILTROS_INICIALES, 0);
    expect(m.densidadPorHa).toBe(0);
    expect(m.areaMediaM2).toBe(0);
    expect(m.coberturaPct).toBe(0);
  });
});
