import { describe, expect, it } from "vitest";
import { armarMensajeDeTransferencia, elegirTipoDeControl, nombreDelLado, rutaDeLaFactura } from "./compensacion";
import type { ControlDocumentos } from "./types";

const control = (cuadra: boolean): ControlDocumentos => ({
  saldo: "0.0000",
  documentos: "0.0000",
  por_documentar: "0.0000",
  diferencia: cuadra ? "0.0000" : "500000.0000",
  cuadra,
});

describe("armarMensajeDeTransferencia", () => {
  it("dice lo compensado cuando hubo algo que compensar", () => {
    const mensaje = armarMensajeDeTransferencia("300000.0000");

    expect(mensaje).toContain("Transferencia registrada. Se compensaron");
    expect(mensaje).toContain("300.000");
  });

  it("no menciona la compensacion cuando no habia nada que compensar", () => {
    expect(armarMensajeDeTransferencia("0.0000")).toBe("Transferencia registrada.");
  });
});

describe("elegirTipoDeControl", () => {
  it("es success cuando los papeles coinciden con la cuenta corriente", () => {
    expect(elegirTipoDeControl(control(true))).toBe("success");
  });

  it("es warning cuando hay diferencia", () => {
    expect(elegirTipoDeControl(control(false))).toBe("warning");
  });
});

describe("nombreDelLado", () => {
  it("distingue la factura al propietario de la factura del propietario", () => {
    expect(nombreDelLado("VENTA")).toBe("Factura al propietario");
    expect(nombreDelLado("COMPRA")).toBe("Factura del propietario");
  });
});

describe("rutaDeLaFactura", () => {
  it("enlaza a la factura de venta o a la compra segun el lado", () => {
    expect(rutaDeLaFactura({ lado: "VENTA", documento_id: 7, numero: "001-002-0000001", monto: "1.0000" })).toBe("/administrador/facturas-venta/show/7");
    expect(rutaDeLaFactura({ lado: "COMPRA", documento_id: 9, numero: "001-001-0000001", monto: "1.0000" })).toBe("/administrador/compras/show/9");
  });
});
