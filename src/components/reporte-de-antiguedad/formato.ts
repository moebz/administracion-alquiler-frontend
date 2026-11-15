import { formatMonto } from "../../utils/monto";
import type { Moneda } from "./types";

/** Da formato a un monto en la moneda de su deuda: los guaraníes como en el resto de la app. */
export const formatearMontoEnMoneda = (monto: string | number, moneda: Moneda): string => {
  if (moneda.codigo === "PYG") {
    return formatMonto(monto);
  }

  return Number(monto).toLocaleString("es-PY", {
    style: "currency",
    currency: moneda.codigo,
    minimumFractionDigits: moneda.decimales,
    maximumFractionDigits: moneda.decimales,
  });
};
