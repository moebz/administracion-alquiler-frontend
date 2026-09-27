import { describe, expect, it } from "vitest";
import { formatPorcentaje } from "./porcentaje";

describe("formatPorcentaje", () => {
  it("saca los ceros de relleno del decimal que manda el backend", () => {
    expect(formatPorcentaje("0.5000")).toBe("0,5%");
  });

  it("muestra hasta 4 decimales", () => {
    expect(formatPorcentaje("0.0333")).toBe("0,0333%");
  });

  it("muestra un entero sin decimales", () => {
    expect(formatPorcentaje(10)).toBe("10%");
  });
});
