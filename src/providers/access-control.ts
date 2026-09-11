import type { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./auth";
import { accessPermission } from "./sections";

// Resources cuyo nombre de permiso no matchea 1 a 1 con el nombre del resource.
const RESOURCE_ALIAS: Record<string, string> = {
  "personas-todos": "personas",
  users: "usuarios",
  "contratos-alquiler": "contratos_alquiler",
  "tipos-identificacion": "tipos_identificacion",
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

// gastos no sigue el patrón crear/editar/gestionar_estado: un único permiso
// (`gastos.solicitar`) gatea tanto el alta como la edición, y aprobar/rechazar
// son acciones propias (botones del listado, no pasan por este mecanismo).
const RESOURCE_ACTION_SUFFIX: Record<string, Record<string, string>> = {
  gastos: { create: ".solicitar", edit: ".solicitar" },
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
  "tipos-identificacion",
  "tipos-relacion",
  "ciudades",
  "gastos",
]);

/** null = acceso permitido sin chequeo (resources agrupadores como "catalogos", o desconocidos). */
export const requiredPermission = (resource: string, action: string): string | null => {
  if (FIXED_PERMISSION[resource]) {
    return FIXED_PERMISSION[resource];
  }

  if (!RESOURCES_WITH_PERMISSIONS.has(resource)) {
    return null;
  }

  const suffix = RESOURCE_ACTION_SUFFIX[resource]?.[action] ?? ACTION_SUFFIX[action];
  if (!suffix) {
    return null;
  }

  return (RESOURCE_ALIAS[resource] ?? resource) + suffix;
};

// Todo resource con permiso propio vive hoy bajo /administrador — sin esto,
// un rol con ej. `edificios.ver` pero sin `acceso.administrador` ve el link
// en el menú aunque SectionRoute lo rebote al entrar.
export const canAccessResource = (permissions: string[], resource: string, action: string): boolean => {
  const permission = requiredPermission(resource, action);
  if (!permission) {
    return true;
  }

  return permissions.includes(permission) && permissions.includes(accessPermission("administrador"));
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    if (!resource) {
      return { can: true };
    }

    const permissions = ((await authProvider.getPermissions?.()) ?? []) as string[];
    return { can: canAccessResource(permissions, resource, action) };
  },
};
