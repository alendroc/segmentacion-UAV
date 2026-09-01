import { afterEach, describe, expect, it, vi } from "vitest";
import { PARAMETROS_POR_DEFECTO } from "@/api/types";
import {
  cancelarTrabajo,
  contarMosaicos,
  crearTrabajo,
  DURACION_MS,
  listarTrabajos,
  obtenerTrabajo,
  reiniciarTrabajos,
} from "@/mocks/trabajos";

function nuevo() {
  return crearTrabajo({
    proyectoId: "pr-001",
    ortomosaicoId: "om-001",
    parametros: PARAMETROS_POR_DEFECTO,
    mosaicosTotales: 9,
    copasAlTerminar: 131,
  });
}

afterEach(() => {
  vi.useRealTimers();
  reiniciarTrabajos();
});

describe("conteo de mosaicos", () => {
  it("sale de la imagen, el tamano y el traslape", () => {
    // 2400 x 2000 px con mosaicos de 1024 y 20 % de traslape: paso de 819.2.
    expect(contarMosaicos(2400, 2000, PARAMETROS_POR_DEFECTO)).toBe(9);
  });

  it("una imagen mas pequena que el mosaico cabe en uno solo", () => {
    expect(contarMosaicos(500, 400, PARAMETROS_POR_DEFECTO)).toBe(1);
  });

  it("mas traslape exige mas mosaicos", () => {
    const poco = contarMosaicos(4000, 4000, {
      ...PARAMETROS_POR_DEFECTO,
      traslapePct: 10,
    });
    const mucho = contarMosaicos(4000, 4000, {
      ...PARAMETROS_POR_DEFECTO,
      traslapePct: 40,
    });
    expect(mucho).toBeGreaterThan(poco);
  });
});

describe("avance del trabajo", () => {
  it("nace sin terminar y guarda sus parametros", () => {
    const t = nuevo();
    expect(t.progreso).toBe(0);
    expect(t.copasDetectadas).toBeNull();
    expect(t.parametros).toEqual(PARAMETROS_POR_DEFECTO);
    expect(t.mosaicosTotales).toBe(9);
  });

  it("avanza con el tiempo transcurrido", () => {
    vi.useFakeTimers();
    const t = nuevo();

    vi.advanceTimersByTime(DURACION_MS / 2);
    const mitad = obtenerTrabajo(t.id);
    expect(mitad?.estado).toBe("ejecutando");
    expect(mitad?.progreso).toBe(50);
    expect(mitad?.etapa).toMatch(/deteccion/i);
  });

  it("termina y reporta las copas detectadas", () => {
    vi.useFakeTimers();
    const t = nuevo();

    vi.advanceTimersByTime(DURACION_MS + 1000);
    const fin = obtenerTrabajo(t.id);
    expect(fin?.estado).toBe("completado");
    expect(fin?.progreso).toBe(100);
    expect(fin?.copasDetectadas).toBe(131);
    expect(fin?.finalizadoEn).not.toBeNull();
  });

  it("la bitacora crece con el avance y avisa de que no hay modelo", () => {
    vi.useFakeTimers();
    const t = nuevo();
    const alInicio = obtenerTrabajo(t.id)?.bitacora.length ?? 0;

    vi.advanceTimersByTime(DURACION_MS);
    const alFinal = obtenerTrabajo(t.id)?.bitacora ?? [];

    expect(alFinal.length).toBeGreaterThan(alInicio);
    expect(alFinal.some((e) => /no hay modelo/i.test(e.mensaje))).toBe(true);
    expect(alFinal.some((e) => e.nivel === "advertencia")).toBe(true);
  });

  it("cancelar congela el avance", () => {
    vi.useFakeTimers();
    const t = nuevo();

    vi.advanceTimersByTime(DURACION_MS / 4);
    const cancelado = cancelarTrabajo(t.id);
    expect(cancelado?.estado).toBe("cancelado");
    const progresoAlCancelar = cancelado?.progreso ?? 0;

    vi.advanceTimersByTime(DURACION_MS);
    const despues = obtenerTrabajo(t.id);
    expect(despues?.estado).toBe("cancelado");
    expect(despues?.progreso).toBe(progresoAlCancelar);
    expect(despues?.copasDetectadas).toBeNull();
  });

  it("un trabajo ya terminado no se puede cancelar hacia atras", () => {
    vi.useFakeTimers();
    const t = nuevo();

    vi.advanceTimersByTime(DURACION_MS + 1000);
    expect(cancelarTrabajo(t.id)?.estado).toBe("completado");
  });

  it("lista solo los trabajos del proyecto pedido", () => {
    nuevo();
    expect(listarTrabajos("pr-001")).toHaveLength(1);
    expect(listarTrabajos("pr-002")).toHaveLength(0);
  });

  it("devuelve null para un trabajo inexistente", () => {
    expect(obtenerTrabajo("tr-inventado")).toBeNull();
  });
});
