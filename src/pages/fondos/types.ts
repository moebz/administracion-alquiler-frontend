export type FondoTipo = "CAJA" | "BANCO" | "OTRO";

export const FONDO_TIPO_OPTIONS: { label: string; value: FondoTipo }[] = [
  { label: "Caja", value: "CAJA" },
  { label: "Banco", value: "BANCO" },
  { label: "Otro", value: "OTRO" },
];

export const FONDO_TIPO_LABEL: Record<FondoTipo, string> = {
  CAJA: "Caja",
  BANCO: "Banco",
  OTRO: "Otro",
};

export type TipoCuenta = "CORRIENTE" | "AHORRO";

export const TIPO_CUENTA_OPTIONS: { label: string; value: TipoCuenta }[] = [
  { label: "Corriente", value: "CORRIENTE" },
  { label: "Ahorro", value: "AHORRO" },
];

export const TIPO_CUENTA_LABEL: Record<TipoCuenta, string> = {
  CORRIENTE: "Corriente",
  AHORRO: "Ahorro",
};

export type FondoRow = {
  id: number;
  nombre: string;
  tipo: FondoTipo;
  banco_id: number | null;
  banco: { id: number; nombre: string } | null;
  tipo_cuenta: TipoCuenta | null;
  numero_cuenta: string | null;
  titular: string | null;
  is_active: boolean;
  fecha_baja: string | null;
  // null si el usuario no tiene fondos.ver_saldo (ver App\Http\Controllers\Admin\FondoController).
  saldo: number | string | null;
};

export type MovimientoFondoTipo = "INGRESO" | "EGRESO";

export const MOVIMIENTO_FONDO_TIPO_LABEL: Record<MovimientoFondoTipo, string> = {
  INGRESO: "Ingreso",
  EGRESO: "Egreso",
};

export type MovimientoFondoOrigenTipo =
  | "COBRO_VALOR"
  | "PAGO_VALOR"
  | "CHEQUE_RECIBIDO"
  | "CHEQUE_EMITIDO"
  | "TRANSFERENCIA"
  | "DEPOSITO_GARANTIA"
  | "AJUSTE";

export const MOVIMIENTO_FONDO_ORIGEN_LABEL: Record<MovimientoFondoOrigenTipo, string> = {
  COBRO_VALOR: "Cobro",
  PAGO_VALOR: "Pago",
  CHEQUE_RECIBIDO: "Cheque recibido",
  CHEQUE_EMITIDO: "Cheque emitido",
  TRANSFERENCIA: "Transferencia entre fondos",
  DEPOSITO_GARANTIA: "Depósito en garantía",
  AJUSTE: "Ajuste",
};

export type MovimientoFondoRow = {
  id: number;
  fecha: string;
  tipo: MovimientoFondoTipo;
  monto_gs: number | string;
  concepto: string | null;
  origen_tipo: MovimientoFondoOrigenTipo;
  origen_id: number;
  estado: "ACTIVO" | "ANULADO";
};
