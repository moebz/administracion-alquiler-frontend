// Tipo + lógica de estado del listado de usuarios, separados del JSX de
// `list.tsx` a propósito: son funciones puras, fáciles de testear el día
// que el proyecto tenga un test runner de frontend (ver ARQUITECTURA.md).

export type UserRow = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
  password_set_at: string | null;
};

export type UserStatus = "invited" | "active" | "inactive";

export const getUserStatus = (
  user: Pick<UserRow, "is_active" | "password_set_at">,
): UserStatus => {
  if (!user.is_active) {
    return "inactive";
  }
  if (!user.password_set_at) {
    return "invited";
  }
  return "active";
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  invited: "Invitado · pendiente",
  active: "Activo",
  inactive: "Inactivo",
};

export const USER_STATUS_COLOR: Record<UserStatus, string> = {
  invited: "gold",
  active: "green",
  inactive: "red",
};
