import { describe, expect, it } from "vitest";
import { buildPermissionRows, groupPermissions, permissionsChanged, type Permission } from "./permissions";

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
