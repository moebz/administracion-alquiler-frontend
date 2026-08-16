import { describe, expect, it } from "vitest";
import { getPriorityRole, isRole, roleHomePath, ROLE_PRIORITY } from "./roles";

describe("isRole", () => {
  it("acepta los 3 roles de negocio", () => {
    for (const role of ROLE_PRIORITY) {
      expect(isRole(role)).toBe(true);
    }
  });

  it("rechaza cualquier otro string", () => {
    expect(isRole("superadmin")).toBe(false);
    expect(isRole("")).toBe(false);
  });
});

describe("getPriorityRole", () => {
  it("devuelve null si la lista de roles esta vacia", () => {
    expect(getPriorityRole([])).toBeNull();
  });

  it("devuelve el unico rol si el usuario tiene uno solo", () => {
    expect(getPriorityRole(["propietario"])).toBe("propietario");
  });

  it("devuelve administrador por sobre los demas, sin importar el orden de entrada", () => {
    expect(getPriorityRole(["inquilino", "propietario", "administrador"])).toBe("administrador");
    expect(getPriorityRole(["administrador", "inquilino"])).toBe("administrador");
  });

  it("respeta la jerarquia propietario > inquilino cuando no hay administrador", () => {
    expect(getPriorityRole(["inquilino", "propietario"])).toBe("propietario");
  });

  it("ignora roles desconocidos que no formen parte de ROLE_PRIORITY", () => {
    expect(getPriorityRole(["algo-inventado"])).toBeNull();
  });
});

describe("roleHomePath", () => {
  it("arma la ruta de home a partir del rol", () => {
    expect(roleHomePath("administrador")).toBe("/administrador/home");
    expect(roleHomePath("propietario")).toBe("/propietario/home");
    expect(roleHomePath("inquilino")).toBe("/inquilino/home");
  });
});
