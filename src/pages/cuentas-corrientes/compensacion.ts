import { formatMonto } from "../../utils/monto";
import type { ControlDocumentos, CompensacionAplicacion } from "./types";

/** Arma el mensaje de éxito de una transferencia: dice lo compensado solo si hubo algo que compensar. */
export const armarMensajeDeTransferencia = (compensado: string): string => {
  if (Number(compensado) > 0) {
    return `Transferencia registrada. Se compensaron ${formatMonto(compensado)}.`;
  }

  return "Transferencia registrada.";
};

/** Dice qué factura cerró la compensación, según el lado. */
export const nombreDelLado = (lado: CompensacionAplicacion["lado"]): string =>
  lado === "VENTA" ? "Factura al propietario" : "Factura del propietario";

/** Arma la ruta de la factura que cerró la compensación: la de venta o la de compra, según el lado. */
export const rutaDeLaFactura = (aplicacion: CompensacionAplicacion): string =>
  aplicacion.lado === "VENTA"
    ? `/administrador/facturas-venta/show/${aplicacion.documento_id}`
    : `/administrador/compras/show/${aplicacion.documento_id}`;

/** Elige el tipo del aviso del control: verde si los papeles coinciden con la cuenta corriente, amarillo si no. */
export const elegirTipoDeControl = (control: ControlDocumentos): "success" | "warning" => (control.cuadra ? "success" : "warning");
