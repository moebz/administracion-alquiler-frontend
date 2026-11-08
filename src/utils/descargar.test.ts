import { describe, expect, it } from "vitest";
import { nombreDelPdfDeLiquidacion, rutaDelPdfDeLiquidacion } from "./descargar";

describe("nombreDelPdfDeLiquidacion", () => {
  it("arma el nombre con el id y el corte, como el backend", () => {
    expect(nombreDelPdfDeLiquidacion(5, "2026-11-30")).toBe("liquidacion-5-2026-11-30.pdf");
  });
});

describe("rutaDelPdfDeLiquidacion", () => {
  it("pide liquidaciones/{id}/pdf sin prefijo, como el panel interno", () => {
    expect(rutaDelPdfDeLiquidacion(5)).toBe("liquidaciones/5/pdf");
  });

  it("pide propietario/liquidaciones/{id}/pdf con el prefijo del portal", () => {
    expect(rutaDelPdfDeLiquidacion(5, "propietario/")).toBe("propietario/liquidaciones/5/pdf");
  });
});
