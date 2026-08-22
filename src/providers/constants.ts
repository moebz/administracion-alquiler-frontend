// import.meta.env.VITE_API_URL: viene de frontend/.env (dev) o
// frontend/.env.production (build de producción, ver ARQUITECTURA.md). El
// literal de acá queda solo como fallback si por algún motivo Vite no
// inyectó la variable.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://api.inmova.test:2090/api";
export const TOKEN_KEY = "refine-auth";
