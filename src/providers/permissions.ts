export type Permission = {
  name: string;
  label: string;
  short_label: string;
  group: string;
  group_label: string;
};

export type RoleWithPermissions = {
  id: number;
  name: string;
  permissions: string[];
  es_sistema: boolean;
  permisos_obligatorios: string[];
  personas_count: number;
};

/** Un permiso obligatorio de un rol de sistema no se puede destildar en el panel. */
export const isPermissionLocked = (role: RoleWithPermissions, permission: string): boolean =>
  role.permisos_obligatorios.includes(permission);

/** Agrupa el catálogo plano que devuelve GET /permissions por su campo `group`. */
export const groupPermissions = (permissions: Permission[]): Record<string, Permission[]> =>
  permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    (groups[permission.group] ??= []).push(permission);
    return groups;
  }, {});

/** Filtra el catálogo por texto libre, contra la etiqueta del grupo y la del permiso. */
export const filterPermissions = (permissions: Permission[], search: string): Permission[] => {
  const term = search.trim().toLowerCase();
  if (!term) {
    return permissions;
  }
  return permissions.filter((permission) =>
    `${permission.group_label} ${permission.label}`.toLowerCase().includes(term),
  );
};

export type GroupCheckboxState = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  togglableNames: string[];
  /** Cuántas de las acciones del grupo están activas (tildadas o bloqueadas), para el contador "2/4". */
  activeCount: number;
  total: number;
};

/**
 * Estado del checkbox "Todos" de un recurso, para el rol elegido: tildado si
 * las N acciones del recurso están todas activas (tildadas o bloqueadas por
 * ser obligatorias), indeterminado si solo algunas, y deshabilitado si el
 * recurso entero es obligatorio para ese rol (nada para tildar/destildar).
 */
export const groupCheckboxState = (
  role: RoleWithPermissions,
  names: string[],
  selected: string[],
): GroupCheckboxState => {
  const togglableNames = names.filter((name) => !isPermissionLocked(role, name));
  const activeCount = names.filter(
    (name) => isPermissionLocked(role, name) || selected.includes(name),
  ).length;
  return {
    checked: activeCount === names.length,
    indeterminate: activeCount > 0 && activeCount < names.length,
    disabled: togglableNames.length === 0,
    togglableNames,
    activeCount,
    total: names.length,
  };
};

/** Tilda o destilda de un saque las acciones togglables (no obligatorias) de un grupo. */
export const toggleGroupPermissions = (
  current: string[],
  togglableNames: string[],
  checked: boolean,
): string[] =>
  checked
    ? Array.from(new Set([...current, ...togglableNames]))
    : current.filter((name) => !togglableNames.includes(name));

/** Compara dos listas de permisos sin importar el orden. */
export const permissionsChanged = (current: string[], original: string[]): boolean => {
  if (current.length !== original.length) {
    return true;
  }
  const sortedCurrent = [...current].sort();
  const sortedOriginal = [...original].sort();
  return sortedCurrent.some((name, index) => name !== sortedOriginal[index]);
};

/** Filtra roles por nombre, para el buscador del panel de roles. */
export const filterRolesByName = (
  roles: RoleWithPermissions[],
  search: string,
): RoleWithPermissions[] => {
  const term = search.trim().toLowerCase();
  if (!term) {
    return roles;
  }
  return roles.filter((role) => role.name.toLowerCase().includes(term));
};

/** Separa los roles de sistema (fijos) de los personalizados, para las dos secciones del panel. */
export const splitRolesByType = (
  roles: RoleWithPermissions[],
): { sistema: RoleWithPermissions[]; personalizados: RoleWithPermissions[] } => ({
  sistema: roles.filter((role) => role.es_sistema),
  personalizados: roles.filter((role) => !role.es_sistema),
});

/**
 * "N de M permisos" para el resumen del panel — cuenta contra el catálogo
 * completo asignable. Toma la lista de nombres seleccionados (no el rol
 * entero) para que sirva tanto con los permisos guardados como con el draft
 * en edición.
 *
 * `selectedNames` puede traer permisos que ya no están en `allPermissions`
 * (ej. de un grupo que se sacó de `Permissions::asignable()`, como
 * `tipos_relacion` — administrador los tiene todos vía `Roles::seedSistema`,
 * ver ARQUITECTURA.md): se ignoran para el conteo, si no `count` termina
 * mayor que `total`.
 */
export const permissionsSummary = (
  selectedNames: string[],
  allPermissions: Permission[],
): { count: number; total: number } => {
  const assignableNames = new Set(allPermissions.map((permission) => permission.name));
  return {
    count: selectedNames.filter((name) => assignableNames.has(name)).length,
    total: allPermissions.length,
  };
};
