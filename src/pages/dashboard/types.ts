import type { Moneda } from "../../components/reporte-de-antiguedad";

/** Un monto en una moneda; el dashboard nunca suma monedas distintas. */
export type MontoPorMoneda = { moneda: Moneda; monto: string };

export type Morosidad = {
  contratos_vigentes: number;
  /** Contratos vigentes con deuda vencida. */
  contratos_morosos: number;
  /** null si no hay contratos vigentes. */
  porcentaje: number | null;
  /** Deuda vencida de los contratos vigentes. */
  monto_vencido: MontoPorMoneda[];
  /** Contratos que ya no están vigentes y todavía deben algo vencido. */
  terminados: { contratos: number; monto_vencido: MontoPorMoneda[] };
};

export type Ocupacion = {
  /** Unidades sin fecha de baja. */
  unidades: number;
  alquiladas: number;
  /** null si no hay unidades activas. */
  porcentaje: number | null;
};

export type Fondos = { montos: MontoPorMoneda[] };

export type NetoDelMes = {
  /** Primer día del mes, YYYY-MM-DD. */
  desde: string;
  /** Hoy, YYYY-MM-DD. */
  hasta: string;
  /** Neto por moneda: ingresos − egresos. */
  montos: MontoPorMoneda[];
  /** Σ de los movimientos con monto positivo. */
  ingresos: MontoPorMoneda[];
  /** Σ del valor absoluto de los movimientos con monto negativo. */
  egresos: MontoPorMoneda[];
};

export type SolicitudesPendientes = {
  cantidad: number;
  montos: MontoPorMoneda[];
};

export type ContratoPorTerminar = {
  id: number;
  unidad: string;
  inquilino: string;
  /** Fecha de fin efectiva (la rescisión, si hay), YYYY-MM-DD. */
  fecha_fin: string;
};

export type ContratosPorTerminar = {
  dias: number;
  contratos: ContratoPorTerminar[];
};

/** Respuesta de `GET /dashboard`: solo trae los indicadores que el usuario tiene permitidos. */
export type DashboardDatos = {
  morosidad?: Morosidad;
  ocupacion?: Ocupacion;
  fondos?: Fondos;
  neto_del_mes?: NetoDelMes;
  solicitudes_pendientes?: SolicitudesPendientes;
  contratos_por_terminar?: ContratosPorTerminar;
};
