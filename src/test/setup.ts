/**
 * Arranque del entorno de pruebas.
 *
 * MSW se registra AQUI y solo aqui. Asi ningun archivo de src/features/,
 * src/components/ o src/store/ necesita importar src/mocks/, ni siquiera en sus
 * pruebas (CLAUDE.md, seccion 2).
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { reiniciarDatosSimulados } from "@/mocks/handlers";
import { server } from "@/mocks/server";

// jsdom no implementa matchMedia y el store de tema lo consulta al arrancar.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  // El mock tiene estado: crear o eliminar proyectos lo modifica y se filtraria
  // de una prueba a la siguiente.
  reiniciarDatosSimulados();
});
afterAll(() => server.close());
