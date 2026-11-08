import dayjs from "dayjs";
import { formatMonto } from "../../utils/monto";
import type { AtrasoDeUnidad, ContratoDeUnidad, UnidadDelPortal } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

const formatearFecha = (fecha: string): string => dayjs(fecha).format(FORMATO_FECHA);

/**
 * Arma el texto del pago del alquiler: "Al día", o "Atrasado" con el detalle de lo que debe y desde cuándo.
 */
export const armarTextoDePago = (atraso: AtrasoDeUnidad): { etiqueta: string; detalle: string | null } => {
  // Al día: no hay alquileres vencidos sin pagar.
  if (atraso.al_dia) {
    return { etiqueta: "Al día", detalle: null };
  }

  // Atrasado: lo que debe de alquiler y hace cuántos días venció el más viejo.
  const dias = atraso.dias ?? 0;
  const unidadDeTiempo = dias === 1 ? "día" : "días";

  return {
    etiqueta: "Atrasado",
    detalle: `debe ${formatMonto(atraso.deuda)} de alquiler, vencido hace ${dias} ${unidadDeTiempo}`,
  };
};

/**
 * Arma lo que se muestra de una unidad sin contrato vigente: "Vacía", o "Alquilada desde" con el inquilino si ya tiene un contrato por empezar.
 */
export const armarTextoSinContrato = (unidad: UnidadDelPortal): { etiqueta: string; inquilino: string | null } => {
  const futuro = unidad.contrato_futuro;

  // Vacía: no tiene ningún contrato por empezar.
  if (futuro === null) {
    return { etiqueta: "Vacía", inquilino: null };
  }

  // Alquilada a futuro: ya tiene inquilino, pero el contrato todavía no empezó.
  return { etiqueta: `Alquilada desde ${formatearFecha(futuro.fecha_inicio)}`, inquilino: futuro.inquilino };
};

/**
 * Arma el texto del contrato: sus fechas, o cuándo termina si la rescisión está programada.
 */
export const armarTextoDeContrato = (contrato: ContratoDeUnidad): string => {
  // Rescisión programada: el contrato termina antes de su fecha de fin.
  if (contrato.rescision_programada) {
    return `Termina el ${formatearFecha(contrato.fecha_fin)} (rescisión)`;
  }

  return `${formatearFecha(contrato.fecha_inicio)} a ${formatearFecha(contrato.fecha_fin)}`;
};
