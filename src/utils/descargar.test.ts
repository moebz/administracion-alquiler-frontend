import { describe, expect, it } from "vitest";
import { nombreDelPdfDeRendicion, rutaDelPdfDeRendicion } from "./descargar";

describe("nombreDelPdfDeRendicion", () => {
  it("arma el nombre con el id y el corte, como el backend", () => {
    expect(nombreDelPdfDeRendicion(5, "2026-11-30")).toBe("rendicion-5-2026-11-30.pdf");
  });
});

describe("rutaDelPdfDeRendicion", () => {
  it("pide rendiciones/{id}/pdf sin prefijo, como el panel interno", () => {
    expect(rutaDelPdfDeRendicion(5)).toBe("rendiciones/5/pdf");
  });

  it("pide propietario/rendiciones/{id}/pdf con el prefijo del portal", () => {
    expect(rutaDelPdfDeRendicion(5, "propietario/")).toBe("propietario/rendiciones/5/pdf");
  });
});
