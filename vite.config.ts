import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
