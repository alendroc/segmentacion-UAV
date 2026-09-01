import { describe, expect, it } from "vitest";
import {
  PASOS,
  pasoAnterior,
  pasoDesdeRuta,
  pasoSiguiente,
  rutaDePaso,
} from "@/lib/pasos";

describe("pasos del flujo", () => {
  it("declara los cuatro pasos en orden", () => {
    expect(PASOS.map((p) => p.clave)).toEqual([
      "carga",
      "procesamiento",
      "visor",
      "exportacion",
    ]);
    expect(PASOS.map((p) => p.numero)).toEqual([1, 2, 3, 4]);
  });

  it("construye la ruta de un paso", () => {
    expect(rutaDePaso("pr-001", "visor")).toBe("/proyectos/pr-001/visor");
  });

  it("reconoce el paso a partir de la ruta", () => {
    expect(pasoDesdeRuta("/proyectos/pr-001/visor")?.clave).toBe("visor");
    expect(pasoDesdeRuta("/proyectos/pr-001/carga")?.numero).toBe(1);
  });

  it("no reconoce paso fuera de un proyecto", () => {
    expect(pasoDesdeRuta("/proyectos")).toBeNull();
  });

  it("encadena los pasos hacia adelante y hacia atras", () => {
    expect(pasoSiguiente("carga")?.clave).toBe("procesamiento");
    expect(pasoAnterior("visor")?.clave).toBe("procesamiento");
  });

  it("cierra el flujo en los extremos", () => {
    expect(pasoAnterior("carga")).toBeNull();
    expect(pasoSiguiente("exportacion")).toBeNull();
  });
});
