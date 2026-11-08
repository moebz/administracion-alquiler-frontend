import dayjs from "dayjs";
import { formatMonto } from "../../utils/monto";
import type { SolicitudTransferencia } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";
const FORMATO_FECHA_HORA = "DD/MM/YYYY HH:mm";

/** Formatea la fecha y hora de un instante (el pedido de una solicitud). */
export const formatearInstante = (instante: string): string => dayjs(instante).format(FORMATO_FECHA_HORA);

/** Formatea una fecha sin hora (YYYY-MM-DD). */
export const formatearFecha = (fecha: string): string => dayjs(fecha).format(FORMATO_FECHA);

/**
 * Arma las frases que el portal le muestra al propietario sobre su solicitud, según cómo esté: una por línea.
 */
export const armarTextosDeSolicitud = (solicitud: SolicitudTransferencia): string[] => {
  const pedido = formatMonto(solicitud.monto);

  if (solicitud.estado === "PENDIENTE") {
    const frases = [`Pediste ${pedido} el ${formatearInstante(solicitud.fecha)}. La administradora la está atendiendo.`];

    // Avisar que la transferencia que la había atendido se anuló y el pedido sigue abierto.
    if (solicitud.pago_anulado?.fecha) {
      frases.push(`La transferencia del ${formatearFecha(solicitud.pago_anulado.fecha)} se anuló.`);
    }

    return frases;
  }

  if (solicitud.estado === "TRANSFERIDA") {
    const transferido = formatMonto(solicitud.transferido ?? 0);
    const fecha = solicitud.pago ? ` el ${formatearFecha(solicitud.pago.fecha)}` : "";
    // Marcar la transferencia anulada cuando la solicitud quedó TRANSFERIDA porque ya había otra pendiente.
    const anulada = solicitud.pago?.anulado ? " (anulada)" : "";

    return [`Pediste ${pedido} · Te transferimos ${transferido}${fecha}${anulada}.`];
  }

  if (solicitud.estado === "RECHAZADA") {
    return [`Rechazada: ${solicitud.motivo_rechazo ?? ""}`.trim()];
  }

  return [`Cancelaste tu solicitud del ${formatearInstante(solicitud.fecha)}.`];
};

/** Arma el aviso del modal de transferir: la solicitud pendiente que esa transferencia va a atender. */
export const armarAvisoDeAtencion = (solicitud: SolicitudTransferencia): string =>
  `Atiende la solicitud de ${solicitud.propietario.nombre} por ${formatMonto(solicitud.monto)} del ${formatearInstante(solicitud.fecha)}.`;

/** Arma el aviso de la cuenta corriente del propietario cuando tiene una solicitud pendiente. */
export const armarAvisoDePedido = (solicitud: SolicitudTransferencia): string =>
  `${solicitud.propietario.nombre} pidió ${formatMonto(solicitud.monto)} el ${formatearInstante(solicitud.fecha)}.`;

/**
 * Elige el monto con que arranca el primer valor del modal de transferir: el de la solicitud, sin pasar
 * el tope; si no hay solicitud, el sugerido. Devuelve undefined si no hay nada que proponer (un monto en cero no se propone).
 */
export const elegirMontoPrecargado = (previa: { sugerido: string; tope: string; solicitud: SolicitudTransferencia | null }): number | undefined => {
  // Proponer lo pedido, recortado al tope para que no supere el saldo a esa fecha; sin saldo no hay nada que proponer.
  if (previa.solicitud) {
    const pedido = Math.min(Number(previa.solicitud.monto), Number(previa.tope));

    return pedido > 0 ? pedido : undefined;
  }

  // Sin solicitud, proponer lo liquidado que todavía no se transfirió.
  if (Number(previa.sugerido) > 0) {
    return Number(previa.sugerido);
  }

  return undefined;
};

/**
 * Elige la cuenta con que arranca el primer valor del modal de transferir: la de la solicitud, solo si
 * sigue entre las cuentas activas del propietario (una dada de baja el backend la rechazaría).
 */
export const elegirCuentaPrecargada = (previa: {
  cuentas: { id: number }[];
  solicitud: SolicitudTransferencia | null;
}): number | undefined => {
  const cuentaId = previa.solicitud?.cuenta?.id;

  if (cuentaId !== undefined && previa.cuentas.some((cuenta) => cuenta.id === cuentaId)) {
    return cuentaId;
  }

  return undefined;
};
