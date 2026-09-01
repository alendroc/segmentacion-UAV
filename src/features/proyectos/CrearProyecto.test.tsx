import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProyectosPage } from "@/features/proyectos/ProyectosPage";
import { renderConProveedores } from "@/test/utils";

/*
 * RF-01, de punta a punta: el formulario envia un POST que MSW intercepta y la
 * lista se refresca. La prueba no importa nada de src/mocks/.
 */
describe("crear un proyecto", () => {
  it("agrega el proyecto a la lista", async () => {
    const usuario = userEvent.setup();
    renderConProveedores(<ProyectosPage />);

    await screen.findByText("Lote Norte");

    await usuario.click(
      screen.getByRole("button", { name: /nuevo proyecto/i }),
    );

    await usuario.type(screen.getByLabelText(/nombre/i), "Lote Sur");
    await usuario.type(screen.getByLabelText(/sitio/i), "Hojancha, Guanacaste");

    await usuario.click(
      screen.getByRole("button", { name: /^crear proyecto$/i }),
    );

    expect(await screen.findByText("Lote Sur")).toBeInTheDocument();
    expect(screen.getByText("Hojancha, Guanacaste")).toBeInTheDocument();
    // Nace sin ortomosaico, asi que el flujo lo llevara primero a la carga.
    // "Barra Honda" ya estaba en ese estado: ahora tienen que ser dos.
    expect(screen.getAllByText("Sin ortomosaico")).toHaveLength(2);
  });

  it("no deja enviar sin nombre", async () => {
    const usuario = userEvent.setup();
    renderConProveedores(<ProyectosPage />);

    await screen.findByText("Lote Norte");
    await usuario.click(
      screen.getByRole("button", { name: /nuevo proyecto/i }),
    );

    expect(
      screen.getByRole("button", { name: /^crear proyecto$/i }),
    ).toBeDisabled();
  });

  it("no arrastra los proyectos creados en otra prueba", async () => {
    renderConProveedores(<ProyectosPage />);

    await screen.findByText("Lote Norte");
    await waitFor(() => {
      expect(screen.queryByText("Lote Sur")).not.toBeInTheDocument();
    });
  });
});
