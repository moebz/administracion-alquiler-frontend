import { describe, expect, it } from "vitest";
import { cubiertoPorFila, repartirCredito } from "./imputacion";

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

describe("repartirCredito", () => {
  it("cubre con el saldo a favor primero y con plata el resto de la primera fila", () => {
    // Arrange
    // Armar una fila cubierta por 3.000.000 y un saldo a favor de 50.000.
    const cubiertos = [3000000];

    // Act
    // Repartir el saldo a favor de la NC.
    const reparto = repartirCredito(cubiertos, 50000);

    // Assert
    // Verificar que la NC paga 50.000 y la plata 2.950.000, no al revés.
    expect(reparto).toEqual([{ notas: 50000, plata: 2950000 }]);
  });

  it("agota el saldo a favor en la primera fila y deja las siguientes solo con plata", () => {
    // Arrange
    // Armar una factura abierta de 50.000 y un alquiler de 3.000.000, con 50.000 de saldo a favor.
    const cubiertos = [50000, 3000000];

    // Act
    // Repartir el saldo a favor de la NC.
    const reparto = repartirCredito(cubiertos, 50000);

    // Assert
    // Verificar que la primera fila se paga entera con la NC y la segunda entera con plata.
    expect(reparto).toEqual([
      { notas: 50000, plata: 0 },
      { notas: 0, plata: 3000000 },
    ]);
  });

  it("pasa el saldo a favor a la fila siguiente cuando no alcanza una sola", () => {
    // Arrange
    // Armar dos filas de 40.000 y 100.000, con 60.000 de saldo a favor.
    const cubiertos = [40000, 100000];

    // Act
    // Repartir el saldo a favor de la NC.
    const reparto = repartirCredito(cubiertos, 60000);

    // Assert
    // Verificar que la NC cubre la primera entera y 20.000 de la segunda, y la plata el resto.
    expect(reparto).toEqual([
      { notas: 40000, plata: 0 },
      { notas: 20000, plata: 80000 },
    ]);
  });

  it("deja todo en plata sin saldo a favor", () => {
    // Arrange
    // Armar dos filas cubiertas y ningún saldo a favor.
    const cubiertos = [135000, 1000000];

    // Act
    // Repartir un saldo a favor en 0.
    const reparto = repartirCredito(cubiertos, 0);

    // Assert
    // Verificar que la plata paga todo lo cubierto.
    expect(reparto).toEqual([
      { notas: 0, plata: 135000 },
      { notas: 0, plata: 1000000 },
    ]);
  });

  it("no reparte mas saldo a favor que lo cubierto y deja en 0 las filas sin cubrir", () => {
    // Arrange
    // Armar una fila cubierta por 50.000 y otra sin cubrir.
    const cubiertos = [50000, 0];

    // Act
    // Repartir 80.000 de saldo a favor, más de lo que hay cubierto.
    const reparto = repartirCredito(cubiertos, 80000);

    // Assert
    // Verificar que la NC no paga más que la fila cubierta y la fila sin cubrir queda en 0 de las dos fuentes.
    expect(reparto).toEqual([
      { notas: 50000, plata: 0 },
      { notas: 0, plata: 0 },
    ]);
  });
});
