import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost:5173" } },
    // El cliente HTTP necesita una URL absoluta bajo Node. Este origen tiene que
    // coincidir con environmentOptions.jsdom.url, o MSW no reconoce la
    // peticion como propia.
    env: {
      VITE_USE_MOCKS: "false",
      VITE_API_URL: "http://localhost:5173/api",
    },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
})
