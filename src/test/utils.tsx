import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

function crearClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
}

/** Monta un componente con los proveedores que le da main.tsx en produccion. */
export function renderConProveedores(
  elemento: ReactElement,
  ruta = "/",
): RenderResult {
  const client = crearClient();

  function Envoltura({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(elemento, { wrapper: Envoltura });
}
