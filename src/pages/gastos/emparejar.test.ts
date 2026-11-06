import { describe, expect, it } from "vitest";
import { emparejarFacturados } from "./emparejar";

describe("emparejarFacturados", () => {
  it("empareja el cargo con la linea del mismo subtotal y tasa aunque cambie la descripcion", () => {
    // Arrange
    // Armar la mano de obra facturada por 600.000 al 10% y un reemplazo con esa línea en segundo lugar.
    const cargos = [{ id: 1, monto_vigente: "600000.0000", tasa_iva: 10 }];
    const lineas = [
      { cantidad: 1, precio_unitario: 400000, tasa_iva: 5 },
      { cantidad: 1, precio_unitario: 600000, tasa_iva: 10 },
    ];

    // Act
    // Emparejar.
    const resultado = emparejarFacturados(cargos, lineas);

    // Assert
    // Verificar que el cargo toma la segunda línea.
    expect(resultado).toEqual({ 1: 1 });
  });

  it("empareja contra el monto vigente del cargo con sus ajustes y no contra su monto solo", () => {
    // Arrange
    // Armar la mano de obra con un monto vigente de 110.000 (100.000 más un ajuste de 10.000) y dos líneas: 100.000 y 110.000.
    const cargos = [{ id: 1, monto_vigente: "110000.0000", tasa_iva: 10 }];
    const lineas = [
      { cantidad: 1, precio_unitario: 100000, tasa_iva: 10 },
      { cantidad: 1, precio_unitario: 110000, tasa_iva: 10 },
    ];

    // Act
    // Emparejar.
    const resultado = emparejarFacturados(cargos, lineas);

    // Assert
    // Verificar que toma la línea de 110.000, no la de 100.000 que coincide con el monto del cargo sin el ajuste.
    expect(resultado).toEqual({ 1: 1 });
  });

  it("no empareja si la tasa es otra aunque el subtotal coincida", () => {
    // Arrange
    // Armar el cargo al 10% y una línea por el mismo subtotal al 5%.
    const cargos = [{ id: 1, monto_vigente: "600000.0000", tasa_iva: 10 }];
    const lineas = [{ cantidad: 1, precio_unitario: 600000, tasa_iva: 5 }];

    // Act
    // Emparejar.
    const resultado = emparejarFacturados(cargos, lineas);

    // Assert
    // Verificar que no hay reapunte.
    expect(resultado).toBeNull();
  });

  it("asigna las lineas repetidas en orden, una por cargo", () => {
    // Arrange
    // Armar dos cargos de 100.000 al 10% y dos líneas iguales.
    const cargos = [
      { id: 2, monto_vigente: "100000.0000", tasa_iva: 10 },
      { id: 1, monto_vigente: "100000.0000", tasa_iva: 10 },
    ];
    const lineas = [
      { cantidad: 1, precio_unitario: 100000, tasa_iva: 10 },
      { cantidad: 1, precio_unitario: 100000, tasa_iva: 10 },
    ];

    // Act
    // Emparejar.
    const resultado = emparejarFacturados(cargos, lineas);

    // Assert
    // Verificar que el cargo de id menor toma la primera línea y el otro la segunda.
    expect(resultado).toEqual({ 1: 0, 2: 1 });
  });

  it("no reapunta ninguno si un facturado queda sin linea", () => {
    // Arrange
    // Armar dos cargos de 100.000 al 10% y una sola línea equivalente.
    const cargos = [
      { id: 1, monto_vigente: "100000.0000", tasa_iva: 10 },
      { id: 2, monto_vigente: "100000.0000", tasa_iva: 10 },
    ];
    const lineas = [
      { cantidad: 1, precio_unitario: 100000, tasa_iva: 10 },
      { cantidad: 1, precio_unitario: 100000, tasa_iva: 5 },
    ];

    // Act
    // Emparejar.
    const resultado = emparejarFacturados(cargos, lineas);

    // Assert
    // Verificar que no hay reapunte aunque el primero sí coincida.
    expect(resultado).toBeNull();
  });
});
