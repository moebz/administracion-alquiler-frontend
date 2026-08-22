import { capitalize } from "../utils/strings";

// Roles de negocio del proyecto y su jerarquía para el redirect post-login
// cuando un usuario tiene más de uno. Ver ARQUITECTURA.md ("Login con multi-rol").
export const ROLE_PRIORITY = ["administrador", "propietario", "inquilino"] as const;

export type Role = (typeof ROLE_PRIORITY)[number];

export const isRole = (value: string): value is Role =>
  (ROLE_PRIORITY as readonly string[]).includes(value);

/** Del listado de roles de un usuario, el de mayor jerarquía (o null si no tiene ninguno). */
export const getPriorityRole = (roles: string[]): Role | null =>
  ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;

export const roleHomePath = (role: Role): string => `/${role}/home`;

/** Opciones para un <Select> de roles, con el label capitalizado para mostrar. */
export const ROLE_OPTIONS = ROLE_PRIORITY.map((role) => ({ label: capitalize(role), value: role }));
