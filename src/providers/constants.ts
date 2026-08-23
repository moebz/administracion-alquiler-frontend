// import.meta.env.VITE_API_URL: viene de frontend/.env (dev) o
// frontend/.env.production (build de producción, ver ARQUITECTURA.md). El
// literal de acá queda solo como fallback si por algún motivo Vite no
// inyectó la variable.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://api.inmova.test:2090/api";
export const TOKEN_KEY = "refine-auth";

// Mismo mecanismo que API_URL: viene de frontend/.env / .env.production, con
// un fallback acá. Nombre de la app mostrado en el menú lateral, login,
// título de la pestaña, etc. — un solo lugar para cambiarlo el día de
// mañana. El backend tiene su propia variable equivalente (APP_NAME en
// backend/.env, ver ARQUITECTURA.md) — son dos repos/despliegues
// independientes, no hay forma de compartir una única variable entre los
// dos sin agregar infraestructura nueva, así que se mantienen en sync a
// mano, por convención, no por mecanismo.
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Inmova";
