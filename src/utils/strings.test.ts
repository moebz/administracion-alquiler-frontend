import { describe, expect, it } from "vitest";
import { capitalize } from "./strings";

describe("capitalize", () => {
  it("pone en mayuscula la primera letra", () => {
    expect(capitalize("usuarios")).toBe("Usuarios");
  });

  it("no toca el resto de la palabra", () => {
    expect(capitalize("administrador")).toBe("Administrador");
  });

  it("devuelve un string vacio sin romper", () => {
    expect(capitalize("")).toBe("");
  });
});
