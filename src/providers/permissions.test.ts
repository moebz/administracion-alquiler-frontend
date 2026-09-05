import { describe, expect, it } from "vitest";
import {
  buildMatrixRows,
  buildPermissionRows,
  filterPermissions,
  filterRoles,
  groupCheckboxState,
  groupPermissions,
  isPermissionLocked,
  permissionsChanged,
  toggleGroupPermissions,
  type Permission,
  type RoleWithPermissions,
} from "./permissions";

const PERMISSIONS: Permission[] = [
  { name: "usuarios.ver", label: "Ver usuarios", group: "usuarios", group_label: "Usuarios" },
  {
    name: "roles.administrar",
    label: "Administrar permisos de los roles",
    group: "roles",
    group_label: "Roles",
  },
  { name: "usuarios.crear", label: "Crear usuarios", group: "usuarios", group_label: "Usuarios" },
];

describe("groupPermissions", () => {
  it("devuelve un objeto vacio si no hay permisos", () => {
    expect(groupPermissions([])).toEqual({});
  });

  it("agrupa los permisos por su campo group, preservando el orden de aparicion", () => {
    expect(groupPermissions(PERMISSIONS)).toEqual({
      usuarios: [
        { name: "usuarios.ver", label: "Ver usuarios", group: "usuarios", group_label: "Usuarios" },
        { name: "usuarios.crear", label: "Crear usuarios", group: "usuarios", group_label: "Usuarios" },
      ],
      roles: [
        {
          name: "roles.administrar",
          label: "Administrar permisos de los roles",
          group: "roles",
          group_label: "Roles",
        },
      ],
    });
  });
});

describe("buildPermissionRows", () => {
  it("devuelve una lista vacia si no hay permisos", () => {
    expect(buildPermissionRows([])).toEqual([]);
  });

  it("marca la primera fila de cada grupo y cuantas filas ocupa", () => {
    const rows = buildPermissionRows(PERMISSIONS);

    expect(rows).toEqual([
      {
        name: "usuarios.ver",
        label: "Ver usuarios",
        group: "usuarios",
        group_label: "Usuarios",
        isFirstInGroup: true,
        groupSize: 2,
      },
      {
        name: "usuarios.crear",
        label: "Crear usuarios",
        group: "usuarios",
        group_label: "Usuarios",
        isFirstInGroup: false,
        groupSize: 2,
      },
      {
        name: "roles.administrar",
        label: "Administrar permisos de los roles",
        group: "roles",
        group_label: "Roles",
        isFirstInGroup: true,
        groupSize: 1,
      },
    ]);
  });
});

describe("buildMatrixRows", () => {
  it("devuelve una lista vacia si no hay permisos", () => {
    expect(buildMatrixRows([])).toEqual([]);
  });

  it("antepone una fila header por grupo, con groupSize contando esa fila", () => {
    const rows = buildMatrixRows(PERMISSIONS);

    expect(rows).toEqual([
      {
        rowType: "group",
        key: "group:usuarios",
        group: "usuarios",
        groupLabel: "Usuarios",
        names: ["usuarios.ver", "usuarios.crear"],
        isFirstInGroup: true,
        groupSize: 3,
      },
      {
        rowType: "permission",
        key: "usuarios.ver",
        name: "usuarios.ver",
        label: "Ver usuarios",
        group: "usuarios",
        group_label: "Usuarios",
        isFirstInGroup: false,
        groupSize: 3,
      },
      {
        rowType: "permission",
        key: "usuarios.crear",
        name: "usuarios.crear",
        label: "Crear usuarios",
        group: "usuarios",
        group_label: "Usuarios",
        isFirstInGroup: false,
        groupSize: 3,
      },
      {
        rowType: "group",
        key: "group:roles",
        group: "roles",
        groupLabel: "Roles",
        names: ["roles.administrar"],
        isFirstInGroup: true,
        groupSize: 2,
      },
      {
        rowType: "permission",
        key: "roles.administrar",
        name: "roles.administrar",
        label: "Administrar permisos de los roles",
        group: "roles",
        group_label: "Roles",
        isFirstInGroup: false,
        groupSize: 2,
      },
    ]);
  });
});

describe("filterPermissions", () => {
  it("devuelve el catalogo completo si el termino esta vacio", () => {
    expect(filterPermissions(PERMISSIONS, "   ")).toEqual(PERMISSIONS);
  });

  it("filtra por la etiqueta del grupo, sin importar mayusculas", () => {
    expect(filterPermissions(PERMISSIONS, "ROLES")).toEqual([PERMISSIONS[1]]);
  });

  it("filtra por la etiqueta del permiso", () => {
    expect(filterPermissions(PERMISSIONS, "crear")).toEqual([PERMISSIONS[2]]);
  });
});

describe("permissionsChanged", () => {
  it("devuelve false si las listas tienen los mismos permisos, sin importar el orden", () => {
    expect(permissionsChanged(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("devuelve true si difiere la cantidad de permisos", () => {
    expect(permissionsChanged(["a"], ["a", "b"])).toBe(true);
  });

  it("devuelve true si son la misma cantidad pero distinto contenido", () => {
    expect(permissionsChanged(["a", "c"], ["a", "b"])).toBe(true);
  });

  it("devuelve false para dos listas vacias", () => {
    expect(permissionsChanged([], [])).toBe(false);
  });
});

describe("isPermissionLocked", () => {
  const administrador: RoleWithPermissions = {
    id: 1,
    name: "administrador",
    permissions: ["roles.administrar", "acceso.administrador"],
    es_sistema: true,
    permisos_obligatorios: ["acceso.administrador", "roles.administrar"],
    personas_count: 1,
  };

  it("devuelve true si el permiso es obligatorio para ese rol", () => {
    expect(isPermissionLocked(administrador, "roles.administrar")).toBe(true);
  });

  it("devuelve false si el permiso no es obligatorio para ese rol", () => {
    expect(isPermissionLocked(administrador, "usuarios.ver")).toBe(false);
  });

  it("devuelve false para un rol custom, que no tiene permisos obligatorios", () => {
    const custom: RoleWithPermissions = {
      id: 2,
      name: "contador",
      permissions: [],
      es_sistema: false,
      permisos_obligatorios: [],
      personas_count: 0,
    };

    expect(isPermissionLocked(custom, "roles.administrar")).toBe(false);
  });
});

describe("groupCheckboxState", () => {
  const administrador: RoleWithPermissions = {
    id: 1,
    name: "administrador",
    permissions: ["roles.administrar", "acceso.administrador"],
    es_sistema: true,
    permisos_obligatorios: ["acceso.administrador", "roles.administrar"],
    personas_count: 1,
  };

  const custom: RoleWithPermissions = {
    id: 2,
    name: "contador",
    permissions: [],
    es_sistema: false,
    permisos_obligatorios: [],
    personas_count: 0,
  };

  it("esta tildado y deshabilitado si todo el grupo es obligatorio para el rol", () => {
    expect(groupCheckboxState(administrador, ["acceso.administrador", "roles.administrar"], [])).toEqual({
      checked: true,
      indeterminate: false,
      disabled: true,
      togglableNames: [],
    });
  });

  it("esta destildado si ningun permiso del grupo esta seleccionado", () => {
    expect(groupCheckboxState(custom, ["usuarios.ver", "usuarios.crear"], [])).toEqual({
      checked: false,
      indeterminate: false,
      disabled: false,
      togglableNames: ["usuarios.ver", "usuarios.crear"],
    });
  });

  it("queda indeterminado si solo algunos permisos del grupo estan seleccionados", () => {
    expect(groupCheckboxState(custom, ["usuarios.ver", "usuarios.crear"], ["usuarios.ver"])).toEqual({
      checked: false,
      indeterminate: true,
      disabled: false,
      togglableNames: ["usuarios.ver", "usuarios.crear"],
    });
  });

  it("esta tildado si estan todos seleccionados, sin depender de permisos obligatorios", () => {
    expect(
      groupCheckboxState(custom, ["usuarios.ver", "usuarios.crear"], ["usuarios.ver", "usuarios.crear"]),
    ).toEqual({
      checked: true,
      indeterminate: false,
      disabled: false,
      togglableNames: ["usuarios.ver", "usuarios.crear"],
    });
  });
});

describe("filterRoles", () => {
  const administrador: RoleWithPermissions = {
    id: 1,
    name: "administrador",
    permissions: [],
    es_sistema: true,
    permisos_obligatorios: [],
    personas_count: 1,
  };

  const contador: RoleWithPermissions = {
    id: 2,
    name: "contador",
    permissions: [],
    es_sistema: false,
    permisos_obligatorios: [],
    personas_count: 0,
  };

  it("devuelve todos los roles si no hay ninguno seleccionado", () => {
    expect(filterRoles([administrador, contador], [])).toEqual([administrador, contador]);
  });

  it("devuelve solo los roles cuyo id esta en la seleccion", () => {
    expect(filterRoles([administrador, contador], [2])).toEqual([contador]);
  });
});

describe("toggleGroupPermissions", () => {
  it("agrega los nombres togglables sin duplicar los que ya estaban", () => {
    expect(toggleGroupPermissions(["usuarios.ver"], ["usuarios.ver", "usuarios.crear"], true)).toEqual([
      "usuarios.ver",
      "usuarios.crear",
    ]);
  });

  it("quita los nombres togglables, dejando el resto intacto", () => {
    expect(
      toggleGroupPermissions(["usuarios.ver", "usuarios.crear", "roles.administrar"], ["usuarios.ver", "usuarios.crear"], false),
    ).toEqual(["roles.administrar"]);
  });
});
