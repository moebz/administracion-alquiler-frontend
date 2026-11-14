import { describe, expect, it } from "vitest";
import {
  armarEtiquetaDeMarca,
  armarTextoDeDocumentos,
  formatearMontoEnMoneda,
  formatearOrigen,
  nombreDelPdfDeCuentasPorCobrar,
  rutaDelPdfDeCuentasPorCobrar,
} from "./helpers";

describe("nombreDelPdfDeCuentasPorCobrar", () => {
  it("arma el nombre con la fecha del dia, como el backend", () => {
    expect(nombreDelPdfDeCuentasPorCobrar("2026-10-31")).toBe("cuentas-por-cobrar-2026-10-31.pdf");
  });
});

describe("rutaDelPdfDeCuentasPorCobrar", () => {
  it("pide el reporte entero si no hay filtros", () => {
    expect(rutaDelPdfDeCuentasPorCobrar({})).toBe("reportes/cuentas-por-cobrar/pdf");
  });

  it("manda el edificio y la unidad elegidos", () => {
    expect(rutaDelPdfDeCuentasPorCobrar({ edificioId: 3, unidadId: 8 })).toBe(
      "reportes/cuentas-por-cobrar/pdf?edificio_id=3&unidad_id=8",
    );
  });

  it("manda solo el filtro que esta activo", () => {
    expect(rutaDelPdfDeCuentasPorCobrar({ unidadId: 8 })).toBe("reportes/cuentas-por-cobrar/pdf?unidad_id=8");
  });
});

describe("armarTextoDeDocumentos", () => {
  it("dice Sin facturar si ninguna factura lleva la deuda", () => {
    // Arrange
    // Armar una deuda sin números de factura y con todo por facturar.
    const documentos = { tipo: "FACTURA" as const, numeros: [], sin_facturar: true };

    // Act
    // Armar el texto de la columna.
    const texto = armarTextoDeDocumentos(documentos);

    // Assert
    // Verificar que no inventa un número que no existe.
    expect(texto).toBe("Sin facturar");
  });

  it("lista los numeros de las facturas separados por coma si esta facturada entera", () => {
    expect(
      armarTextoDeDocumentos({ tipo: "FACTURA", numeros: ["001-002-0000001", "001-002-0000005"], sin_facturar: false }),
    ).toBe("Factura 001-002-0000001, 001-002-0000005");
  });

  it("agrega que el resto esta sin facturar si esta facturada en parte", () => {
    expect(armarTextoDeDocumentos({ tipo: "FACTURA", numeros: ["001-002-0000001"], sin_facturar: true })).toBe(
      "Factura 001-002-0000001 · resto sin facturar",
    );
  });

  it("nombra NC al documento de una nota de credito", () => {
    expect(armarTextoDeDocumentos({ tipo: "NOTA_CREDITO", numeros: ["001-003-0000002"], sin_facturar: false })).toBe(
      "NC 001-003-0000002",
    );
  });
});

describe("armarEtiquetaDeMarca", () => {
  it("dice que se espera la factura del proveedor si la factura se anulo", () => {
    expect(armarEtiquetaDeMarca("FACTURA_ANULADA", "INQUILINO")).toBe("Esperando factura del proveedor");
  });

  it("usa el tag del listado de cargos para revisar la factura, segun el deudor", () => {
    expect(armarEtiquetaDeMarca("REVISAR_FACTURA", "INQUILINO")).toBe("Revisar factura al inquilino");
    expect(armarEtiquetaDeMarca("REVISAR_FACTURA", "PROPIETARIO")).toBe("Revisar factura al propietario");
  });
});

describe("formatearMontoEnMoneda", () => {
  it("formatea los guaranies como el resto de la app, sin decimales", () => {
    // Arrange
    // Armar la moneda guaraní, que no usa decimales.
    const guarani = { id: 1, codigo: "PYG", decimales: 0 };

    // Act
    // Dar formato a un monto entero.
    const texto = formatearMontoEnMoneda("3000000.0000", guarani);

    // Assert
    // Verificar que lleva el separador de miles y ningún decimal.
    expect(texto).toContain("3.000.000");
    expect(texto).not.toContain(",");
  });

  it("formatea otra moneda con sus decimales y su codigo", () => {
    // Arrange
    // Armar una moneda con 2 decimales.
    const dolar = { id: 2, codigo: "USD", decimales: 2 };

    // Act
    // Dar formato a un monto con centavos.
    const texto = formatearMontoEnMoneda("250.5000", dolar);

    // Assert
    // Verificar que muestra los 2 decimales con coma.
    expect(texto).toContain("250,50");
  });
});

describe("formatearOrigen", () => {
  it("muestra el periodo como MM/YYYY", () => {
    expect(formatearOrigen("2026-10", "2026-10-05")).toBe("10/2026");
  });

  it("muestra la fecha como DD/MM/YYYY si la deuda no tiene periodo", () => {
    expect(formatearOrigen(null, "2026-10-31")).toBe("31/10/2026");
  });
});
