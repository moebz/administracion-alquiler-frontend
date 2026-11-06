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
};
