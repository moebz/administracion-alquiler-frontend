import { describe, expect, it } from "vitest";
import { nombreDelPdfDeLiquidacion } from "./descargar";

describe("nombreDelPdfDeLiquidacion", () => {
  it("arma el nombre con el id y el corte, como el backend", () => {
    expect(nombreDelPdfDeLiquidacion(5, "2026-11-30")).toBe("liquidacion-5-2026-11-30.pdf");
  });
});
