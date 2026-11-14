import { describe, expect, it } from "vitest";
import {
  nombreDelPdfDeDocumentoVenta,
  nombreDelPdfDeRendicion,
  rutaDelPdfDeDocumentoVenta,
  rutaDelPdfDeRendicion,
} from "./descargar";

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

describe("rutaDelPdfDeDocumentoVenta", () => {
  it("pide facturas-venta/{id}/pdf sin prefijo, como el panel interno", () => {
    expect(rutaDelPdfDeDocumentoVenta(7)).toBe("facturas-venta/7/pdf");
  });

  it("antepone el prefijo del portal si se lo pasan", () => {
    expect(rutaDelPdfDeDocumentoVenta(7, "propietario/")).toBe("propietario/facturas-venta/7/pdf");
  });
});

describe("nombreDelPdfDeDocumentoVenta", () => {
  it("arma factura-{numero impreso}.pdf para una factura, como el backend", () => {
    expect(nombreDelPdfDeDocumentoVenta("FACTURA", "001-001-0000123")).toBe("factura-001-001-0000123.pdf");
  });

  it("arma nota-credito-{numero impreso}.pdf para una NC, como el backend", () => {
    expect(nombreDelPdfDeDocumentoVenta("NOTA_CREDITO", "001-001-0000045")).toBe("nota-credito-001-001-0000045.pdf");
  });
});
