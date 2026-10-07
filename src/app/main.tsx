import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { inicializarTema } from "@/shared/store/temaStore";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Arranca el service worker de MSW antes de montar React. Si se monta primero,
 * la primera peticion escapa sin interceptar.
 */
async function iniciarSimulacion(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;
  const { worker } = await import("../mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

async function arrancar(): Promise<void> {
  inicializarTema();
  await iniciarSimulacion();

  const contenedor = document.getElementById("root");
  if (!contenedor) throw new Error('No se encontro el elemento #root.');

  createRoot(contenedor).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void arrancar();
