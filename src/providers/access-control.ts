import type { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./auth";
import { accessPermission, type Section } from "./sections";

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

// roles y las pantallas propias de la sección propietario se gatean con un
// único permiso sin importar la acción. `catalogos` es un resource agrupador
// puro (sin list/create/edit propio, ver App.tsx): todos sus hijos ya piden
// acceso.administrador indirectamente (bancos.ver, etc. exigen también
// acceso.administrador vía RESOURCE_SECTION), pero el nodo padre en sí no
// tenía ningún permiso asociado — quedaba visible en el menú para cualquier
// sección (ver "resources agrupadores" más abajo). Se lo ata acá
// explícitamente para que no aparezca fuera de /administrador.
const FIXED_PERMISSION: Record<string, string> = {
  roles: "roles.administrar",
  catalogos: "acceso.administrador",
  "propietario/gastos": "gastos.aprobar_propio",
};

// Resources con `meta.parent: "catalogos"` en App.tsx. ThemedSider (ver
// @refinedev/antd) solo chequea el permiso del propio nodo padre al decidir
// si renderiza el SubMenu — no mira si algún hijo es visible — así que sin
// este chequeo extra un rol con acceso.administrador pero sin ningún permiso
// de catálogo (ej. bancos.ver, fondos.ver) ve "Catálogos" en el menú con el
// submenú vacío al desplegarlo.
const CATALOGOS_CHILDREN = ["bancos", "fondos", "tipos-identificacion", "tipos-relacion", "ciudades"];

// Sección a la que pertenece cada resource, para el chequeo de acceso.accion
// de abajo. Default "administrador": hoy todo resource con permiso propio
// vive ahí, salvo el que se declare acá explícitamente.
const RESOURCE_SECTION: Record<string, Section> = {
  "propietario/gastos": "propietario",
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
  "fondos",
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

/** null = acceso permitido sin chequeo (resources desconocidos, o agrupadores sin entrada en FIXED_PERMISSION). */
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

// Un resource con permiso propio además necesita el acceso de la sección
// donde vive (RESOURCE_SECTION, default "administrador") — sin esto, un rol
// con ej. `edificios.ver` pero sin `acceso.administrador` vería el link en
// el menú aunque SectionRoute lo rebote al entrar.
export const canAccessResource = (permissions: string[], resource: string, action: string): boolean => {
  // Ver comentario de CATALOGOS_CHILDREN: además del permiso fijo del nodo
  // padre, exigimos que al menos un catálogo hijo sea accesible.
  if (resource === "catalogos") {
    return (
      permissions.includes(accessPermission("administrador")) &&
      CATALOGOS_CHILDREN.some((child) => canAccessResource(permissions, child, "list"))
    );
  }

  const permission = requiredPermission(resource, action);
  if (!permission) {
    return true;
  }

  const section = RESOURCE_SECTION[resource] ?? "administrador";
  return permissions.includes(permission) && permissions.includes(accessPermission(section));
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
