import type { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./auth";

// Resources cuyo nombre de permiso no matchea 1 a 1 con el nombre del resource.
const RESOURCE_ALIAS: Record<string, string> = {
  "personas-todos": "personas",
  users: "usuarios",
  "contratos-alquiler": "contratos_alquiler",
  "tipos-documento": "tipos_documento",
  "tipos-relacion": "tipos_relacion",
  "edificios-todos": "edificios",
  "proveedores-todos": "proveedores",
};

// roles/permisos se gatean con un único permiso sin importar la acción.
const FIXED_PERMISSION: Record<string, string> = {
  roles: "roles.administrar",
  permisos: "roles.administrar",
};

const ACTION_SUFFIX: Record<string, string> = {
  list: ".ver",
  show: ".ver",
  create: ".crear",
  edit: ".editar",
  delete: ".gestionar_estado",
};

const RESOURCES_WITH_PERMISSIONS = new Set([
  "personas",
  "personas-todos",
  "users",
  "edificios",
  "edificios-todos",
  "bloques",
  "unidades",
  "bancos",
  "comodidades",
  "proveedores",
  "proveedores-todos",
  "rubros",
  "contratos-alquiler",
  "tipos-documento",
  "tipos-relacion",
  "ciudades",
]);

/** null = acceso permitido sin chequeo (resources agrupadores como "catalogos", o desconocidos). */
export const requiredPermission = (resource: string, action: string): string | null => {
  if (FIXED_PERMISSION[resource]) {
    return FIXED_PERMISSION[resource];
  }

  if (!RESOURCES_WITH_PERMISSIONS.has(resource)) {
    return null;
  }

  const suffix = ACTION_SUFFIX[action];
  if (!suffix) {
    return null;
  }

  return (RESOURCE_ALIAS[resource] ?? resource) + suffix;
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const permission = resource ? requiredPermission(resource, action) : null;
    if (!permission) {
      return { can: true };
    }

    const permissions = ((await authProvider.getPermissions?.()) ?? []) as string[];
    return { can: permissions.includes(permission) };
  },
};
