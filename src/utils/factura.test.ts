import { describe, expect, it } from "vitest";
import { subtotalLinea, totalesFactura } from "./factura";

describe("subtotalLinea", () => {
  it("redondea cantidad por precio a guaranies enteros", () => {
    expect(subtotalLinea({ cantidad: 1.5, precio_unitario: 3333 })).toBe(5000);
  });

  it("devuelve 0 si faltan datos", () => {
    expect(subtotalLinea({})).toBe(0);
  });
});

describe("totalesFactura", () => {
  it("agrupa exentas y gravadas por tasa", () => {
    const totales = totalesFactura([
      { cantidad: 1, precio_unitario: 1100000, tasa_iva: 10 },
      { cantidad: 2, precio_unitario: 100000, tasa_iva: 0 },
      { cantidad: 1, precio_unitario: 210000, tasa_iva: 5 },
    ]);

    expect(totales).toMatchObject({ exentas: 200000, gravadas_5: 210000, gravadas_10: 1100000, total: 1510000 });
  });

  it("calcula el iva sobre el acumulado de cada columna", () => {
    const totales = totalesFactura([
      { cantidad: 1, precio_unitario: 50000, tasa_iva: 10 },
      { cantidad: 1, precio_unitario: 60000, tasa_iva: 10 },
      { cantidad: 1, precio_unitario: 21000, tasa_iva: 5 },
    ]);

    expect(totales.iva_10).toBe(10000);
    expect(totales.iva_5).toBe(1000);
  });
});
