export type Permission = {
  name: string;
  label: string;
  group: string;
};

export type RoleWithPermissions = {
  id: number;
  name: string;
  permissions: string[];
  es_sistema: boolean;
  permisos_obligatorios: string[];
  personas_count: number;
};

/** Un permiso obligatorio de un rol de sistema no se puede destildar en la matriz. */
export const isPermissionLocked = (role: RoleWithPermissions, permission: string): boolean =>
  role.permisos_obligatorios.includes(permission);

export type PermissionRow = Permission & {
  isFirstInGroup: boolean;
  groupSize: number;
};

/** Agrupa el catálogo plano que devuelve GET /permissions por su campo `group`. */
export const groupPermissions = (permissions: Permission[]): Record<string, Permission[]> =>
  permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    (groups[permission.group] ??= []).push(permission);
    return groups;
  }, {});

/**
 * Aplana el catálogo agrupado en filas para la tabla-matriz (permiso ×
 * rol), marcando la primera fila de cada grupo y cuántas filas ocupa —
 * para el `rowSpan` de la columna "Recurso".
 */
export const buildPermissionRows = (permissions: Permission[]): PermissionRow[] =>
  Object.values(groupPermissions(permissions)).flatMap((items) =>
    items.map((permission, index) => ({
      ...permission,
      isFirstInGroup: index === 0,
      groupSize: items.length,
    })),
  );

/** Compara dos listas de permisos sin importar el orden. */
export const permissionsChanged = (current: string[], original: string[]): boolean => {
  if (current.length !== original.length) {
    return true;
  }
  const sortedCurrent = [...current].sort();
  const sortedOriginal = [...original].sort();
  return sortedCurrent.some((name, index) => name !== sortedOriginal[index]);
};
