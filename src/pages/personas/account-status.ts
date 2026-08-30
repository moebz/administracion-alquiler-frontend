// Tipo + lógica de estado de la CUENTA de una persona (sub-recurso, ver
// ARQUITECTURA.md). Las claves coinciden con los valores que ya espera el
// filtro `estado_cuenta` del backend (GET /personas) — así el mismo
// vocabulario sirve para las opciones del filtro y para el tag de estado
// de cada fila, sin mantener dos listas en paralelo.

export type PersonaUsuario = {
  id: number;
  email: string;
  is_active: boolean;
  password_set_at: string | null;
} | null;

export type AccountStatus = "sin_cuenta" | "invitado" | "activo" | "inactivo";

export const getAccountStatus = (usuario: PersonaUsuario): AccountStatus => {
  if (!usuario) {
    return "sin_cuenta";
  }
  if (!usuario.is_active) {
    return "inactivo";
  }
  if (!usuario.password_set_at) {
    return "invitado";
  }
  return "activo";
};

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  sin_cuenta: "Sin cuenta",
  invitado: "Invitado · pendiente",
  activo: "Activo",
  inactivo: "Inactivo",
};

export const ACCOUNT_STATUS_COLOR: Record<AccountStatus, string> = {
  sin_cuenta: "default",
  invitado: "gold",
  activo: "green",
  inactivo: "red",
};

export const ACCOUNT_STATUS_OPTIONS = (Object.keys(ACCOUNT_STATUS_LABEL) as AccountStatus[]).map((value) => ({
  value,
  label: ACCOUNT_STATUS_LABEL[value],
}));
