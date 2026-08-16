import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// SEED_PASSWORD (usada por e2e/support/api.ts) tiene que matchear el
// DEFAULT_SEED_PASSWORD real de backend/.env — si no matchean, el login del
// admin seedeado en cada `beforeAll` tira `ValidationException`, y como el
// request no manda `Accept: application/json`, Laravel la renderiza como
// redirect (302) en vez de 422; Playwright sigue ese redirect y termina
// reportando un 500 de DB que no tiene nada que ver con la password real
// (ver DECISIONES.md, "E2E: falla masiva por SEED_PASSWORD"). Se lee acá,
// una sola vez, para no tener que pasarla a mano en cada corrida — un
// `SEED_PASSWORD=...` explícito en el entorno sigue pisando esto.
if (!process.env.SEED_PASSWORD) {
  const backendEnvPath = path.resolve(__dirname, "../backend/.env");
  if (existsSync(backendEnvPath)) {
    const match = readFileSync(backendEnvPath, "utf-8").match(/^DEFAULT_SEED_PASSWORD=(.*)$/m);
    if (match) {
      process.env.SEED_PASSWORD = match[1].trim();
    }
  }
}

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
