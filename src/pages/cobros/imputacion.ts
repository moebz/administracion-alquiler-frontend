// Reparte el total del cobro (valores más saldo a favor de las NC) entre las filas de la imputación, en orden: cada fila toma lo que le falta hasta su saldo y
// la última que alcanza queda cubierta en parte (mismo criterio que CobroCargosService::filasCubiertas()). Devuelve lo
// cubierto de cada fila, 0 en las que el total no llega.
export const cubiertoPorFila = (saldos: (string | number)[], total: number): number[] => {
  let restante = Math.max(total, 0);

  return saldos.map((saldo) => {
    const cubierto = Math.min(restante, Number(saldo));
    restante -= cubierto;

    return cubierto;
  });
};

// Reparte el saldo a favor de las NC entre las filas ya cubiertas, en orden: cada fila usa primero el saldo a favor y
// la plata cubre el resto (mismo criterio que RepartirNotasYPlata del backend). Devuelve, por fila, lo que paga cada
// fuente; el saldo a favor que sobra de lo cubierto no se reparte.
export const repartirCredito = (cubiertos: number[], saldoAFavor: number): { notas: number; plata: number }[] => {
  let restante = Math.max(saldoAFavor, 0);

  return cubiertos.map((cubierto) => {
    const notas = Math.min(restante, cubierto);
    restante -= notas;

    return { notas, plata: cubierto - notas };
  });
};
