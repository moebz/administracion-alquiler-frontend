import { subtotalLinea, type LineaFactura } from "../../utils/factura";

export type CargoFacturado = { id: number; monto: number | string; tasa_iva: number };

/**
 * Empareja cada cargo facturado con la primera línea libre de la factura del
 * proveedor con el mismo subtotal (= monto del cargo) y la misma tasa; cada
 * línea se usa una sola vez, en orden, y la descripción no cuenta. Es la
 * misma regla que GastoService::emparejarFacturados() del backend. Devuelve
 * el índice de línea de cada cargo, o null si algún cargo queda sin línea.
 */
export const emparejarFacturados = (cargos: CargoFacturado[], lineas: LineaFactura[]): Record<number, number> | null => {
  const usadas = new Set<number>();
  const emparejados: Record<number, number> = {};

  for (const cargo of [...cargos].sort((a, b) => a.id - b.id)) {
    // Buscar la primera línea libre con el mismo subtotal y la misma tasa.
    const indice = lineas.findIndex(
      (linea, i) => !usadas.has(i) && linea.tasa_iva === cargo.tasa_iva && subtotalLinea(linea) === Number(cargo.monto),
    );

    // Cortar si un cargo no tiene línea equivalente: no se reapunta ninguno.
    if (indice === -1) {
      return null;
    }

    usadas.add(indice);
    emparejados[cargo.id] = indice;
  }

  return emparejados;
};
