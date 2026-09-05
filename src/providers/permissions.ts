export type Permission = {
  name: string;
  label: string;
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

/** Fila "header" de un grupo: el toggle que tilda/destilda todo el recurso de un saque. */
export type MatrixGroupRow = {
  rowType: "group";
  key: string;
  group: string;
  groupLabel: string;
  names: string[];
  isFirstInGroup: true;
  groupSize: number;
};

export type MatrixPermissionRow = Permission & {
  rowType: "permission";
  key: string;
  isFirstInGroup: false;
  groupSize: number;
};

export type MatrixRow = MatrixGroupRow | MatrixPermissionRow;

/**
 * Arma las filas de la matriz permiso × rol: una fila "header" por grupo
 * (para el toggle de "todo el recurso") seguida de sus filas de permiso. El
 * `groupSize` de la fila header cuenta también su propia fila, para el
 * `rowSpan` de la columna "Recurso" (que arranca en el header y cubre sus
 * filas de permiso).
 */
export const buildMatrixRows = (permissions: Permission[]): MatrixRow[] =>
  Object.entries(groupPermissions(permissions)).flatMap(([group, items]) => {
    const header: MatrixGroupRow = {
      rowType: "group",
      key: `group:${group}`,
      group,
      groupLabel: items[0]?.group_label ?? group,
      names: items.map((item) => item.name),
      isFirstInGroup: true,
      groupSize: items.length + 1,
    };
    const rows: MatrixPermissionRow[] = items.map((item) => ({
      ...item,
      rowType: "permission",
      key: item.name,
      isFirstInGroup: false,
      groupSize: items.length + 1,
    }));
    return [header, ...rows];
  });

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
};

/**
 * Estado del checkbox "todo el recurso" de una fila header, para un rol
 * dado: tildado si las N acciones del grupo están todas activas (tildadas o
 * bloqueadas por ser obligatorias), indeterminado si solo algunas, y
 * deshabilitado si el grupo entero es obligatorio para ese rol (nada para
 * tildar/destildar).
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

/** Filtra qué columnas de rol se muestran en la matriz; sin selección, se muestran todas. */
export const filterRoles = (
  roles: RoleWithPermissions[],
  selectedIds: number[],
): RoleWithPermissions[] =>
  selectedIds.length === 0 ? roles : roles.filter((role) => selectedIds.includes(role.id));

/** Compara dos listas de permisos sin importar el orden. */
export const permissionsChanged = (current: string[], original: string[]): boolean => {
  if (current.length !== original.length) {
    return true;
  }
  const sortedCurrent = [...current].sort();
  const sortedOriginal = [...original].sort();
  return sortedCurrent.some((name, index) => name !== sortedOriginal[index]);
};
