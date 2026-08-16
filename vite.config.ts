// `defineConfig` de "vitest/config" (no de "vite") para que el campo `test`
// de abajo tenga tipado — sigue siendo un config de Vite normal, Vitest lo
// reusa tal cual (mismos plugins/alias que el build real).
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Solo unit tests de lógica pura por ahora (helpers/definitions, ver
    // DECISIONES.md) — nada de componentes ni DOM, así que alcanza con el
    // entorno "node" (más rápido que jsdom, no hace falta acá).
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    // 0.0.0.0 (no el hostname literal): tiene que escuchar en todas las
    // interfaces para que el mapeo de puertos de Docker (host 25173 ->
    // contenedor 5173) lo alcance. Puerto interno del contenedor: se sigue
    // publicando afuera como 25173 (ver DECISIONES.md, esquema de puertos).
    host: "0.0.0.0",
    port: 5173,
    // Vite rechaza por default requests cuyo header Host no matchee algo
    // conocido (protección contra DNS rebinding). Como accedemos vía
    // app.inmova.test y no localhost, hay que permitirlo explícito.
    allowedHosts: ["app.inmova.test"],
  },
});
