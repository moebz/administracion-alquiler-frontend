import { describe, expect, it } from "vitest";
import {
  armarAvisoDeTransferencias,
  armarEnlaceDelDocumento,
  armarTextoDeDocumento,
  nombreDelPdfDeCuentasPorPagar,
  rutaDelPdfDeCuentasPorPagar,
} from "./helpers";

describe("nombreDelPdfDeCuentasPorPagar", () => {
  it("arma el nombre con la fecha del dia, como el backend", () => {
    expect(nombreDelPdfDeCuentasPorPagar("2026-10-31")).toBe("cuentas-por-pagar-2026-10-31.pdf");
  });
});

describe("rutaDelPdfDeCuentasPorPagar", () => {
  it("pide el reporte entero si no hay filtros", () => {
    expect(rutaDelPdfDeCuentasPorPagar({})).toBe("reportes/cuentas-por-pagar/pdf");
  });

  it("manda el edificio y la unidad elegidos", () => {
    expect(rutaDelPdfDeCuentasPorPagar({ edificioId: 3, unidadId: 8 })).toBe("reportes/cuentas-por-pagar/pdf?edificio_id=3&unidad_id=8");
  });

  it("manda solo el filtro que esta activo", () => {
    expect(rutaDelPdfDeCuentasPorPagar({ unidadId: 8 })).toBe("reportes/cuentas-por-pagar/pdf?unidad_id=8");
  });
});

describe("armarTextoDeDocumento", () => {
  it("nombra el numero del papel de una factura, una ND y una NC del proveedor", () => {
    expect(armarTextoDeDocumento({ tipo: "CUOTA", documentos: { tipo: "FACTURA", numeros: ["001-001-0000001"], sin_facturar: false } })).toBe(
      "Factura 001-001-0000001",
    );
    expect(armarTextoDeDocumento({ tipo: "CUOTA", documentos: { tipo: "NOTA_DEBITO", numeros: ["001-001-0000200"], sin_facturar: false } })).toBe(
      "ND 001-001-0000200",
    );
    expect(armarTextoDeDocumento({ tipo: "NC", documentos: { tipo: "NOTA_CREDITO", numeros: ["001-001-0000100"], sin_facturar: false } })).toBe(
      "NC 001-001-0000100",
    );
  });

  it("dice Pago N° en el anticipo", () => {
    expect(armarTextoDeDocumento({ tipo: "ANTICIPO", documentos: { tipo: "PAGO", numeros: ["12"], sin_facturar: false } })).toBe("Pago N° 12");
  });

  it("dice que es una transferencia y su pago en la transferencia sin aplicar", () => {
    expect(armarTextoDeDocumento({ tipo: "TRANSFERENCIA", documentos: { tipo: "PAGO", numeros: ["15"], sin_facturar: false } })).toBe(
      "Transferencia (pago N° 15)",
    );
  });

  it("dice Falta su factura si el propietario no facturo el alquiler", () => {
    // Arrange
    // Armar un alquiler sin facturas del propietario y con todo por facturar.
    const alquiler = { tipo: "ALQUILER" as const, documentos: { tipo: "FACTURA" as const, numeros: [], sin_facturar: true } };

    // Act
    // Armar el texto de la columna.
    const texto = armarTextoDeDocumento(alquiler);

    // Assert
    // Verificar que no inventa un número que no existe.
    expect(texto).toBe("Falta su factura");
  });

  it("lista las facturas del propietario separadas por coma si facturo el alquiler entero", () => {
    expect(
      armarTextoDeDocumento({ tipo: "ALQUILER", documentos: { tipo: "FACTURA", numeros: ["001-001-0000001", "001-001-0000005"], sin_facturar: false } }),
    ).toBe("Factura 001-001-0000001, 001-001-0000005");
  });

  it("agrega que el resto esta sin facturar si el propietario facturo solo una parte", () => {
    expect(
      armarTextoDeDocumento({ tipo: "ALQUILER", documentos: { tipo: "FACTURA", numeros: ["001-001-0000001"], sin_facturar: true } }),
    ).toBe("Factura 001-001-0000001 · resto sin facturar");
  });
});

describe("armarEnlaceDelDocumento", () => {
  const todos = { puedeVerGastos: true, puedeVerPagos: true };

  it("lleva la cuota y la NC del proveedor al gasto", () => {
    expect(armarEnlaceDelDocumento({ gasto_id: 7, pago_proveedor_id: null }, todos)).toBe("/administrador/gastos/show/7");
  });

  it("lleva el anticipo y la transferencia al pago", () => {
    expect(armarEnlaceDelDocumento({ gasto_id: null, pago_proveedor_id: 12 }, todos)).toBe("/administrador/pagos-proveedor/show/12");
  });

  it("no hace link si el usuario no puede ver la pantalla a la que llevaria", () => {
    expect(armarEnlaceDelDocumento({ gasto_id: 7, pago_proveedor_id: null }, { puedeVerGastos: false, puedeVerPagos: true })).toBeNull();
    expect(armarEnlaceDelDocumento({ gasto_id: null, pago_proveedor_id: 12 }, { puedeVerGastos: true, puedeVerPagos: false })).toBeNull();
  });

  it("no hace link si la fila no tiene gasto ni pago, como el alquiler", () => {
    expect(armarEnlaceDelDocumento({ gasto_id: null, pago_proveedor_id: null }, todos)).toBeNull();
  });
});

describe("armarAvisoDeTransferencias", () => {
  it("avisa el monto en su moneda y que se ve sin filtro", () => {
    // Arrange
    // Armar la moneda guaraní y el monto de las transferencias que el filtro dejó afuera.
    const guarani = { id: 1, codigo: "PYG", decimales: 0 };

    // Act
    // Armar el aviso.
    const aviso = armarAvisoDeTransferencias("1000000.0000", guarani);

    // Assert
    // Verificar que dice el monto con separador de miles y que explica por qué no se ve con filtro.
    expect(aviso).toContain("1.000.000");
    expect(aviso).toContain("no son de una unidad; se ven sin filtro");
  });
});
