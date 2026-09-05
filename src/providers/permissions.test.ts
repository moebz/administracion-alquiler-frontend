import { describe, expect, it } from "vitest";
import {
  buildPermissionRows,
  groupPermissions,
  isPermissionLocked,
  permissionsChanged,
  type Permission,
  type RoleWithPermissions,
} from "./permissions";

const PERMISSIONS: Permission[] = [
  { name: "usuarios.ver", label: "Ver usuarios", group: "usuarios" },
  { name: "roles.administrar", label: "Administrar permisos de los roles", group: "roles" },
  { name: "usuarios.crear", label: "Crear usuarios", group: "usuarios" },
];

describe("groupPermissions", () => {
  it("devuelve un objeto vacio si no hay permisos", () => {
    expect(groupPermissions([])).toEqual({});
  });

  it("agrupa los permisos por su campo group, preservando el orden de aparicion", () => {
    expect(groupPermissions(PERMISSIONS)).toEqual({
      usuarios: [
        { name: "usuarios.ver", label: "Ver usuarios", group: "usuarios" },
        { name: "usuarios.crear", label: "Crear usuarios", group: "usuarios" },
      ],
      roles: [
        { name: "roles.administrar", label: "Administrar permisos de los roles", group: "roles" },
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
      { name: "usuarios.ver", label: "Ver usuarios", group: "usuarios", isFirstInGroup: true, groupSize: 2 },
      { name: "usuarios.crear", label: "Crear usuarios", group: "usuarios", isFirstInGroup: false, groupSize: 2 },
      {
        name: "roles.administrar",
        label: "Administrar permisos de los roles",
        group: "roles",
        isFirstInGroup: true,
        groupSize: 1,
      },
    ]);
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
