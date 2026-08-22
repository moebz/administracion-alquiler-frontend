import { describe, expect, it } from "vitest";
import { PASSWORD_REQUIREMENTS, passwordMeetsComplexity } from "./password";

const requirement = (key: string) => {
  const found = PASSWORD_REQUIREMENTS.find((r) => r.key === key);
  if (!found) {
    throw new Error(`No existe el requisito ${key}`);
  }
  return found;
};

describe("PASSWORD_REQUIREMENTS", () => {
  it("length exige al menos 8 caracteres", () => {
    expect(requirement("length").test("1234567")).toBe(false);
    expect(requirement("length").test("12345678")).toBe(true);
  });

  it("uppercase exige al menos una mayuscula", () => {
    expect(requirement("uppercase").test("todaminuscula")).toBe(false);
    expect(requirement("uppercase").test("tieneUnaMayuscula")).toBe(true);
  });

  it("lowercase exige al menos una minuscula", () => {
    expect(requirement("lowercase").test("TODAMAYUSCULA")).toBe(false);
    expect(requirement("lowercase").test("TieneUnaMinuscula")).toBe(true);
  });

  it("number exige al menos un numero", () => {
    expect(requirement("number").test("sinnumeros")).toBe(false);
    expect(requirement("number").test("con1numero")).toBe(true);
  });

  it("symbol exige al menos un simbolo", () => {
    expect(requirement("symbol").test("sinsimbolos123")).toBe(false);
    expect(requirement("symbol").test("con-simbolo123")).toBe(true);
  });
});

describe("passwordMeetsComplexity", () => {
  it("devuelve false si falta algun requisito", () => {
    expect(passwordMeetsComplexity("todaminuscula")).toBe(false);
    expect(passwordMeetsComplexity("")).toBe(false);
  });

  it("devuelve true si cumple los 5 requisitos", () => {
    expect(passwordMeetsComplexity("Password-123")).toBe(true);
  });
});
