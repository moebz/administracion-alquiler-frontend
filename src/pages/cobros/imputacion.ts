// Reparte el total cobrado entre las filas de la imputación, en orden: cada fila toma lo que le falta hasta su saldo y
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
