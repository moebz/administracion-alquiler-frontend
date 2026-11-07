// Los montos `decimal:4` del backend llegan como string.
export type CuentaCorrienteResumenRow = {
  id: number;
  nombre: string;
  documento: string;
  /** Saldo a hoy: Σ de las líneas con fecha hasta hoy. */
  saldo: string;
};

export type CuentaCorrienteLinea = {
  id: number;
  monto: string;
};

export type CuentaCorrienteMovimiento = {
  /** YYYY-MM-DD */
  fecha: string;
  unidad: string;
  concepto: string;
  monto: string;
  /** Saldo acumulado hasta esta fila. */
  saldo: string;
  /** Liquidación que selló las líneas de la fila; null si todavía no se liquidaron. */
  liquidacion_id: number | null;
  /** Pago al propietario que originó la fila; null si no es una transferencia. */
  pago_proveedor_id: number | null;
  lineas: CuentaCorrienteLinea[];
};

export type CuentaCorrienteDetalle = {
  propietario: { id: number; nombre: string; documento: string };
  /** YYYY-MM-DD */
  saldo_al: string;
  saldo: string;
  /** Lo que vence después de `saldo_al`. */
  por_vencer: string;
  movimientos: CuentaCorrienteMovimiento[];
  /** Si se puede liquidar con `saldo_al` como corte y, si no, por qué. */
  liquidar: { disponible: boolean; motivo: string | null };
};

export type LiquidacionEstado = "CONFIRMADA" | "ANULADA";

export const LIQUIDACION_ESTADO_LABEL: Record<LiquidacionEstado, string> = {
  CONFIRMADA: "Confirmada",
  ANULADA: "Anulada",
};

export type LiquidacionResumen = {
  id: number;
  /** YYYY-MM-DD */
  corte: string;
  saldo_anterior: string;
  total: string;
  saldo_final: string;
  estado: LiquidacionEstado;
  /** YYYY-MM-DD */
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};

/** Una fila del historial: solo la última liquidación confirmada se puede anular. */
export type LiquidacionHistorialRow = LiquidacionResumen & { puede_anular: boolean };

export type LiquidacionDetalle = LiquidacionResumen & {
  propietario: { id: number; nombre: string; documento: string };
  /** Vacío en una liquidación anulada: sus líneas volvieron a quedar sin liquidar. */
  movimientos: CuentaCorrienteMovimiento[];
};

export type LiquidacionVistaPrevia = {
  propietario: { id: number; nombre: string; documento: string };
  /** YYYY-MM-DD */
  corte: string;
  saldo_anterior: string;
  total: string;
  saldo_final: string;
  movimientos: CuentaCorrienteMovimiento[];
};

export type TransferenciaVistaPrevia = {
  propietario: { id: number; nombre: string; documento: string };
  /** YYYY-MM-DD */
  fecha: string;
  /** Lo liquidado que todavía no se transfirió. */
  sugerido: string;
  /** Saldo del propietario a `fecha`: lo máximo que se le puede transferir. */
  tope: string;
  /** Cuentas bancarias activas del propietario. */
  cuentas: { id: number; banco: string; numero_cuenta: string }[];
};
