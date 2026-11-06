import { describe, expect, it } from "vitest";
import { describirPermisosFaltantes, emiteNotasCredito, permisoParaCorregir, puedeCorregirMonto } from "./correccion";
import type { PasoCorreccion } from "./types";

describe("permisoParaCorregir", () => {
  it("pide el permiso de la mora para una mora", () => {
    expect(permisoParaCorregir("MORA")).toBe("cargos.corregir_mora");
  });

  it("pide el permiso general para cualquier otro tipo", () => {
    expect(permisoParaCorregir("ALQUILER")).toBe("cargos.corregir_monto");
    expect(permisoParaCorregir("OTRO")).toBe("cargos.corregir_monto");
  });
});

describe("puedeCorregirMonto", () => {
  it("lo ofrece con el permiso del tipo en un cargo activo", () => {
    expect(puedeCorregirMonto({ tipo: "ALQUILER", estado: "PAGADO" }, ["cargos.corregir_monto"])).toBe(true);
  });

  it("no lo ofrece en una mora con solo el permiso general", () => {
    expect(puedeCorregirMonto({ tipo: "MORA", estado: "PAGADO" }, ["cargos.corregir_monto"])).toBe(false);
  });

  it("no lo ofrece en un ajuste ni en un cargo anulado", () => {
    expect(puedeCorregirMonto({ tipo: "AJUSTE", estado: "PENDIENTE" }, ["cargos.corregir_monto"])).toBe(false);
    expect(puedeCorregirMonto({ tipo: "ALQUILER", estado: "ANULADO" }, ["cargos.corregir_monto"])).toBe(false);
  });

  it("no lo ofrece sin permisos cargados", () => {
    expect(puedeCorregirMonto({ tipo: "ALQUILER", estado: "PENDIENTE" }, undefined)).toBe(false);
  });
});

describe("emiteNotasCredito", () => {
  const baja: PasoCorreccion = {
    tipo: "BAJAR",
    cargo_id: 1,
    descripcion: "Alquiler",
    monto_anterior: "3000000.0000",
    monto_nuevo: "1000000.0000",
    importe: "2000000.0000",
    anula: false,
    texto: "",
  };
  const nc: PasoCorreccion = {
    tipo: "NC",
    documento_venta_id: 5,
    numero: "001-002-0000001",
    lineas: [],
    total: "200000.0000",
    aplicado_a_cuota: "0.0000",
    saldo_a_favor: "200000.0000",
    texto: "",
  };

  it("detecta una NC entre los pasos", () => {
    expect(emiteNotasCredito([baja, nc])).toBe(true);
  });

  it("no detecta NC si el plan solo cambia montos", () => {
    expect(emiteNotasCredito([baja])).toBe(false);
  });
});

describe("describirPermisosFaltantes", () => {
  it("nombra el permiso que falta", () => {
    expect(describirPermisosFaltantes(["facturas.emitir_nc"])).toBe("Te falta permiso para emitir notas de crédito.");
  });

  it("une varios permisos con una y", () => {
    expect(describirPermisosFaltantes(["cargos.corregir_monto", "facturas.emitir_nc"])).toBe(
      "Te falta permiso para corregir el monto de los cargos y para emitir notas de crédito.",
    );
  });

  it("deja el código de un permiso que no conoce", () => {
    expect(describirPermisosFaltantes(["otro.permiso"])).toBe("Te falta permiso para otro.permiso.");
  });
});
