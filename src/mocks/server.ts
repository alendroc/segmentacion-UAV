import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Equivalente de browser.ts para el entorno de pruebas. */
export const server = setupServer(...handlers);
