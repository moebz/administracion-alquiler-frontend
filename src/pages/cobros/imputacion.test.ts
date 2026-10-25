import { describe, expect, it } from "vitest";
import { cubiertoPorFila } from "./imputacion";

describe("cubiertoPorFila", () => {
  it("cubre enteras todas las filas si el total coincide con el acumulado de la ultima", () => {
    // Arrange
    // Armar el alquiler de 3.000.000 y la expensa de 450.000, que suman 3.450.000.
    const saldos = ["3000000.0000", "450000.0000"];

    // Act
    // Repartir exactamente el acumulado de las dos filas.
    const cubierto = cubiertoPorFila(saldos, 3450000);

    // Assert
    // Verificar que las dos filas quedan cubiertas por su saldo entero.
    expect(cubierto).toEqual([3000000, 450000]);
  });

  it("deja la ultima fila que alcanza cubierta en parte y las siguientes en 0", () => {
    // Arrange
    // Armar una mora de 135.000, el alquiler de 3.000.000 y la expensa de 450.000.
    const saldos = ["135000.0000", "3000000.0000", "450000.0000"];

    // Act
    // Repartir 1.135.000, que pasa la mora y no llega a cubrir el alquiler.
    const cubierto = cubiertoPorFila(saldos, 1135000);

    // Assert
    // Verificar que la mora va entera, el alquiler por 1.000.000 y la expensa sin cubrir.
    expect(cubierto).toEqual([135000, 1000000, 0]);
  });

  it("no cubre mas que el saldo de cada fila aunque el total supere lo cobrable", () => {
    // Arrange
    // Armar el alquiler de 3.000.000 como única fila.
    const saldos = ["3000000.0000"];

    // Act
    // Repartir 3.100.000, más de lo que hay para cobrar.
    const cubierto = cubiertoPorFila(saldos, 3100000);

    // Assert
    // Verificar que la fila queda en su saldo: el sobrante no se reparte, lo rechaza el modal antes de cobrar.
    expect(cubierto).toEqual([3000000]);
  });

  it("no cubre ninguna fila con un total en 0", () => {
    // Arrange
    // Armar el alquiler de 3.000.000 como única fila.
    const saldos = ["3000000.0000"];

    // Act
    // Repartir un total en 0, el de un modal recién abierto sin montos cargados.
    const cubierto = cubiertoPorFila(saldos, 0);

    // Assert
    // Verificar que la fila queda sin cubrir, si no el modal la mostraría como parcial.
    expect(cubierto).toEqual([0]);
  });
});
