import { describe, expect, it } from "vitest";
import {
  accessPermission,
  getAccessibleSections,
  getPrioritySection,
  isSection,
  sectionHomePath,
  SECTIONS,
} from "./sections";

describe("isSection", () => {
  it("acepta las 3 secciones", () => {
    for (const section of SECTIONS) {
      expect(isSection(section)).toBe(true);
    }
  });

  it("rechaza cualquier otro string", () => {
    expect(isSection("superadmin")).toBe(false);
    expect(isSection("")).toBe(false);
  });
});

describe("accessPermission", () => {
  it("arma el nombre del permiso de acceso a partir de la seccion", () => {
    expect(accessPermission("administrador")).toBe("acceso.administrador");
    expect(accessPermission("propietario")).toBe("acceso.propietario");
    expect(accessPermission("inquilino")).toBe("acceso.inquilino");
  });
});

describe("getAccessibleSections", () => {
  it("devuelve vacio si no hay ningun permiso de acceso", () => {
    expect(getAccessibleSections([])).toEqual([]);
  });

  it("devuelve solo las secciones con su permiso de acceso, en orden de prioridad", () => {
    expect(getAccessibleSections(["acceso.inquilino", "acceso.administrador"])).toEqual([
      "administrador",
      "inquilino",
    ]);
  });

  it("ignora permisos que no son de acceso", () => {
    expect(getAccessibleSections(["bancos.ver"])).toEqual([]);
  });
});

describe("getPrioritySection", () => {
  it("devuelve null si la lista de permisos esta vacia", () => {
    expect(getPrioritySection([])).toBeNull();
  });

  it("devuelve la unica seccion accesible si el usuario tiene una sola", () => {
    expect(getPrioritySection(["acceso.propietario"])).toBe("propietario");
  });

  it("devuelve administrador por sobre las demas, sin importar el orden de entrada", () => {
    expect(getPrioritySection(["acceso.inquilino", "acceso.propietario", "acceso.administrador"])).toBe(
      "administrador",
    );
  });

  it("respeta la prioridad propietario > inquilino cuando no hay acceso de administrador", () => {
    expect(getPrioritySection(["acceso.inquilino", "acceso.propietario"])).toBe("propietario");
  });

  it("ignora permisos desconocidos que no formen parte de SECTIONS", () => {
    expect(getPrioritySection(["algo-inventado"])).toBeNull();
  });
});

describe("sectionHomePath", () => {
  it("arma la ruta de home a partir de la seccion", () => {
    expect(sectionHomePath("administrador")).toBe("/administrador/home");
    expect(sectionHomePath("propietario")).toBe("/propietario/home");
    expect(sectionHomePath("inquilino")).toBe("/inquilino/home");
  });
});
