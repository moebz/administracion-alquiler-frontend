import { defineConfig, devices } from "@playwright/test";

// E2E contra la app real (frontend + backend + DB) — no contra mocks. No hay
// `webServer` acá a propósito: el proyecto corre en varios contenedores
// (docker-compose) o nativo (Apache/Vite), y arrancar esa orquestación no es
// algo que Playwright pueda hacer por sí solo con un único comando. Se asume
// que la app YA está corriendo cuando se ejecuta `npx playwright test` — ver
// `e2e/README.md`.
//
// PLAYWRIGHT_BASE_URL / PLAYWRIGHT_API_URL: default a los puertos de
// desarrollo en Docker (ver DECISIONES.md, "Dominios y puertos") — pisables
// por env var si se corre contra el setup nativo (Apache) u otro entorno.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://app.inmova.test:25173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
