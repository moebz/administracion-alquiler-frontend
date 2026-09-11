import { describe, expect, it } from "vitest";
import {
  filterPermissions,
  filterRolesByName,
  groupCheckboxState,
  groupPermissions,
  isPermissionLocked,
  permissionsChanged,
  permissionsSummary,
  splitRolesByType,
  toggleGroupPermissions,
  type Permission,
  type RoleWithPermissions,
} from "./permissions";

const PERMISSIONS: Permission[] = [
  {
    name: "usuarios.ver",
    label: "Ver usuarios",
    short_label: "Ver",
    group: "usuarios",
    group_label: "Usuarios",
  },
  {
    name: "roles.administrar",
    label: "Administrar permisos de los roles",
    short_label: "Administrar permisos",
    group: "roles",
    group_label: "Roles",
  },
  {
    name: "usuarios.crear",
    label: "Crear usuarios",
    short_label: "Crear",
    group: "usuarios",
    group_label: "Usuarios",
  },
];

describe("groupPermissions", () => {
  it("devuelve un objeto vacio si no hay permisos", () => {
    expect(groupPermissions([])).toEqual({});
  });

  it("agrupa los permisos por su campo group, preservando el orden de aparicion", () => {
    expect(groupPermissions(PERMISSIONS)).toEqual({
      usuarios: [PERMISSIONS[0], PERMISSIONS[2]],
      roles: [PERMISSIONS[1]],
    });
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
      activeCount: 2,
      total: 2,
    });
  });

  it("esta destildado si ningun permiso del grupo esta seleccionado", () => {
    expect(groupCheckboxState(custom, ["usuarios.ver", "usuarios.crear"], [])).toEqual({
      checked: false,
      indeterminate: false,
      disabled: false,
      togglableNames: ["usuarios.ver", "usuarios.crear"],
      activeCount: 0,
      total: 2,
    });
  });

  it("queda indeterminado si solo algunos permisos del grupo estan seleccionados", () => {
    expect(groupCheckboxState(custom, ["usuarios.ver", "usuarios.crear"], ["usuarios.ver"])).toEqual({
      checked: false,
      indeterminate: true,
      disabled: false,
      togglableNames: ["usuarios.ver", "usuarios.crear"],
      activeCount: 1,
      total: 2,
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
      activeCount: 2,
      total: 2,
    });
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

describe("filterRolesByName", () => {
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

  it("devuelve todos los roles si el termino esta vacio", () => {
    expect(filterRolesByName([administrador, contador], "  ")).toEqual([administrador, contador]);
  });

  it("filtra por nombre, sin importar mayusculas", () => {
    expect(filterRolesByName([administrador, contador], "CONTA")).toEqual([contador]);
  });
});

describe("splitRolesByType", () => {
  it("separa los roles de sistema de los personalizados, preservando el orden", () => {
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
    const cobrador: RoleWithPermissions = {
      id: 3,
      name: "cobrador",
      permissions: [],
      es_sistema: false,
      permisos_obligatorios: [],
      personas_count: 0,
    };

    expect(splitRolesByType([administrador, contador, cobrador])).toEqual({
      sistema: [administrador],
      personalizados: [contador, cobrador],
    });
  });
});

describe("permissionsSummary", () => {
  it("cuenta los nombres seleccionados contra el total del catalogo", () => {
    expect(permissionsSummary(["usuarios.ver", "usuarios.crear"], PERMISSIONS)).toEqual({
      count: 2,
      total: 3,
    });
  });

  it("devuelve 0 de N sin seleccion", () => {
    expect(permissionsSummary([], PERMISSIONS)).toEqual({ count: 0, total: 3 });
  });

  it("no cuenta permisos que el rol tiene pero ya no estan en el catalogo asignable (ej. administrador con tipos_relacion)", () => {
    expect(
      permissionsSummary(["usuarios.ver", "usuarios.crear", "tipos_relacion.ver"], PERMISSIONS),
    ).toEqual({ count: 2, total: 3 });
  });
});
