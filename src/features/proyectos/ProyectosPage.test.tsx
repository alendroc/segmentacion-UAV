import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProyectosPage } from "@/features/proyectos/ProyectosPage";
import { renderConProveedores } from "@/test/utils";

/*
 * Los datos llegan por HTTP interceptado. Esta prueba no importa nada de
 * src/mocks/: el servidor se registra en src/test/setup.ts.
 */
describe("ProyectosPage", () => {
  it("muestra los proyectos que devuelve GET /proyectos", async () => {
    renderConProveedores(<ProyectosPage />);

    expect(await screen.findByText("Lote Norte")).toBeInTheDocument();
    expect(screen.getByText("Quebrada Seca")).toBeInTheDocument();
  });

  it("rotula el estado de cada proyecto", async () => {
    renderConProveedores(<ProyectosPage />);

    expect(await screen.findByText("Completado")).toBeInTheDocument();
    expect(screen.getByText("En proceso")).toBeInTheDocument();
    expect(screen.getByText("Error de georreferencia")).toBeInTheDocument();
  });

  it("distingue los proyectos sin deteccion ejecutada", async () => {
    renderConProveedores(<ProyectosPage />);

    expect(await screen.findByText("147 copas detectadas")).toBeInTheDocument();
    expect(screen.getAllByText("Sin deteccion ejecutada")).toHaveLength(3);
  });
});
