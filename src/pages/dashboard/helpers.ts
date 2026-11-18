import dayjs from "dayjs";
import { formatearMontoEnMoneda } from "../../components/reporte-de-antiguedad";
import { formatPorcentaje } from "../../utils/porcentaje";
import type { DashboardDatos, MontoPorMoneda, Morosidad, NetoDelMes, Ocupacion, SolicitudesPendientes } from "./types";

/** Elige el singular o el plural según la cantidad. */
const elegirPlural = (cantidad: number, singular: string, plural: string): string => (cantidad === 1 ? singular : plural);

/** Dice si el dashboard trae al menos un indicador. */
export const hayIndicadores = (datos: DashboardDatos): boolean => Object.keys(datos).length > 0;

/** Da formato a un porcentaje, o devuelve `textoVacio` si no hay con qué calcularlo. */
export const formatearPorcentajeOTextoVacio = (porcentaje: number | null, textoVacio: string): string => {
  if (porcentaje === null) {
    return textoVacio;
  }

  return formatPorcentaje(porcentaje);
};

/** Arma el valor grande de la tarjeta de morosidad. */
export const armarValorDeMorosidad = (morosidad: Morosidad): string => formatearPorcentajeOTextoVacio(morosidad.porcentaje, "Sin contratos vigentes");

/** Arma el valor grande de la tarjeta de ocupación. */
export const armarValorDeOcupacion = (ocupacion: Ocupacion): string => formatearPorcentajeOTextoVacio(ocupacion.porcentaje, "Sin unidades");

/** Arma el texto de apoyo de la morosidad ("1 de 2 contratos vigentes"), o null si no hay contratos vigentes. */
export const armarTextoDeContratosMorosos = (morosidad: Morosidad): string | null => {
  if (morosidad.contratos_vigentes === 0) {
    return null;
  }

  return `${morosidad.contratos_morosos} de ${morosidad.contratos_vigentes} ${elegirPlural(
    morosidad.contratos_vigentes,
    "contrato vigente",
    "contratos vigentes"
  )} con deuda vencida`;
};

/** Arma el texto de los contratos terminados con deuda vencida, o null si no hay ninguno. */
export const armarTextoDeTerminados = (terminados: Morosidad["terminados"]): string | null => {
  if (terminados.contratos === 0) {
    return null;
  }

  const contratos = `${terminados.contratos} ${elegirPlural(terminados.contratos, "contrato terminado", "contratos terminados")}`;

  return `${contratos} con deuda vencida: ${armarTextoDeMontos(terminados.monto_vencido)}`;
};

/** Arma el texto de apoyo de la ocupación ("1 de 3 unidades alquiladas"), o null si no hay unidades activas. */
export const armarTextoDeUnidades = (ocupacion: Ocupacion): string | null => {
  if (ocupacion.unidades === 0) {
    return null;
  }

  return `${ocupacion.alquiladas} de ${ocupacion.unidades} ${elegirPlural(ocupacion.unidades, "unidad alquilada", "unidades alquiladas")}`;
};

/** Elige los montos a mostrar: los que no están en cero, o los guaraníes (el primero) si todos están en cero. */
export const elegirMontosAMostrar = (montos: MontoPorMoneda[]): MontoPorMoneda[] => {
  const conMonto = montos.filter((fila) => Number(fila.monto) !== 0);

  if (conMonto.length > 0) {
    return conMonto;
  }

  return montos.slice(0, 1);
};

/** Da formato a los montos de cada moneda y los une en una línea; la moneda en cero se omite si hay otra con monto. */
export const armarTextoDeMontos = (montos: MontoPorMoneda[]): string =>
  elegirMontosAMostrar(montos)
    .map((fila) => formatearMontoEnMoneda(fila.monto, fila.moneda))
    .join(" · ");

/** Arma la línea gris de las transferencias pendientes: que no hay ninguna, o cuánto suman. */
export const armarTextoDeSolicitudes = (solicitudes: SolicitudesPendientes): string => {
  if (solicitudes.cantidad === 0) {
    return "Ninguna pendiente";
  }

  return `Suman ${armarTextoDeMontos(solicitudes.montos)}`;
};

/** Arma el plazo de la tarjeta de contratos por terminar ("Próximos 60 días"). */
export const armarTextoDelPlazo = (dias: number): string => `Próximos ${dias} días`;

/** Arma el texto de la tarjeta de contratos cuando ninguno termina en el plazo. */
export const armarTextoSinContratosPorTerminar = (dias: number): string => `Ninguno en los próximos ${dias} días`;

/**
 * Arma la línea de ingresos y egresos del neto del mes. Con una sola moneda queda "Ingresos X · Egresos Y"; con
 * varias, un grupo por moneda separados por " / " para no mezclarlas. Se omiten las monedas sin movimientos, salvo
 * los guaraníes si no hay ninguna.
 */
export const armarTextoDeIngresosYEgresos = (neto: Pick<NetoDelMes, "ingresos" | "egresos">): string => {
  const egresosPorMoneda = new Map(neto.egresos.map((fila) => [fila.moneda.id, fila.monto]));
  const grupos = neto.ingresos.map((fila) => ({
    moneda: fila.moneda,
    ingresos: fila.monto,
    egresos: egresosPorMoneda.get(fila.moneda.id) ?? "0",
  }));
  const conMovimientos = grupos.filter((grupo) => Number(grupo.ingresos) !== 0 || Number(grupo.egresos) !== 0);

  // Mostrar la primera moneda (guaraníes) en cero si ninguna tuvo movimientos.
  const aMostrar = conMovimientos.length > 0 ? conMovimientos : grupos.slice(0, 1);

  return aMostrar
    .map(
      (grupo) => `Ingresos ${formatearMontoEnMoneda(grupo.ingresos, grupo.moneda)} · Egresos ${formatearMontoEnMoneda(grupo.egresos, grupo.moneda)}`
    )
    .join(" / ");
};

/** Arma el período del neto del mes en DD/MM/YYYY. `desde` y `hasta` son YYYY-MM-DD. */
export const armarTextoDelPeriodo = (desde: string, hasta: string): string =>
  `Del ${dayjs(desde).format("DD/MM/YYYY")} al ${dayjs(hasta).format("DD/MM/YYYY")}`;
