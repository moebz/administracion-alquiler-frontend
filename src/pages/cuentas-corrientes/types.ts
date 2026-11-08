import type { CompraCondicion, CompraEstado } from "../compras/types";

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

export type PorDocumentarNotaLinea = {
  detalle_id: number;
  cargo_id: number;
  descripcion: string;
  monto: string;
};

/** NC que le falta emitir al propietario sobre una de sus facturas: un alquiler bajó después de facturado. */
export type PorDocumentarNota = {
  factura_id: number;
  numero: string;
  monto: string;
  lineas: PorDocumentarNotaLinea[];
};

/** Factura que le falta emitir al propietario por un alquiler que ya venció al corte. */
export type PorDocumentarFactura = {
  cargo_id: number;
  descripcion: string;
  /** YYYY-MM */
  periodo: string;
  monto: string;
};

/** Lo que le falta documentar al propietario (su factura o su NC por los alquileres) a una fecha de corte. */
export type PorDocumentar = {
  notas: PorDocumentarNota[];
  facturas: PorDocumentarFactura[];
  total_notas: string;
  total_facturas: string;
};

/**
 * Control de saldo contra documentos: lo que dice la cuenta corriente del propietario contra lo que dicen sus papeles.
 * Compara todo, sin fecha. `diferencia` = saldo − documentos − por documentar; `cuadra` si es 0.
 */
export type ControlDocumentos = {
  saldo: string;
  documentos: string;
  por_documentar: string;
  diferencia: string;
  cuadra: boolean;
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
  /** Solo viene con `liquidaciones.ver`. */
  por_documentar?: PorDocumentar;
  /** Solo viene con `liquidaciones.ver`. */
  control?: ControlDocumentos;
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
  por_documentar: PorDocumentar;
  control: ControlDocumentos;
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
  por_documentar: PorDocumentar;
  control: ControlDocumentos;
};

/** Respuesta de transferir: el pago registrado y lo que se compensó de las facturas abiertas con el propietario. */
export type TransferenciaRegistrada = {
  id: number;
  numero: number;
  /** YYYY-MM-DD */
  fecha: string;
  concepto: string | null;
  monto_total: string;
  /** 0 si no había nada que compensar. */
  compensado: string;
};

export type FacturacionConcepto = "REINTEGRO" | "OTRO" | "COMISION";

export const FACTURACION_CONCEPTO_LABEL: Record<FacturacionConcepto, string> = {
  REINTEGRO: "Reintegro",
  OTRO: "Otro",
  COMISION: "Comisión",
};

/** Línea de la factura al propietario que se emitiría: el reintegro o la comisión de un cargo. */
export type FacturacionLinea = {
  cargo_id: number;
  concepto: FacturacionConcepto;
  tasa_iva: number;
  descripcion: string;
  monto: string;
};

export type FacturacionNotaLinea = {
  cargo_id: number;
  concepto: FacturacionConcepto;
  descripcion: string;
  monto: string;
};

/** NC de comisión que se emitiría sobre una factura al propietario con comisión de más. */
export type FacturacionNota = {
  documento_venta_id: number;
  numero: string | null;
  lineas: FacturacionNotaLinea[];
  total: string;
};

export type FacturacionVistaPrevia = {
  propietario: { id: number; nombre: string; documento: string };
  /** YYYY-MM */
  periodo: string;
  lineas: FacturacionLinea[];
  notas: FacturacionNota[];
  /** Total de la factura (sin las NC). */
  total: string;
  /** Permisos que pide emitir esto: los de facturar y, si hay NC, el de emitir NC. */
  permisos: string[];
};

/** Lo que se manda al confirmar: la vista previa que vio el usuario, para que el backend avise si cambió. */
export type FacturarSeleccion = {
  periodo: string;
  punto_expedicion_id?: number;
  esperado: { lineas: FacturacionLinea[]; notas: FacturacionNota[] };
};

export type FacturaPropietarioRow = {
  id: number;
  numero: string | null;
  /** YYYY-MM-DD */
  fecha: string;
  /** Vencimiento de su cuota, YYYY-MM-DD. */
  vencimiento: string | null;
  total: string;
  saldo: string;
  estado: "BORRADOR" | "EMITIDO" | "ANULADO";
};

/** Línea prearmada de la factura del propietario: un alquiler con lo que le falta facturar. */
export type FacturaPropietarioLineaPrevia = {
  cargo_id: number;
  tasa_iva: number;
  descripcion: string;
  monto: string;
};

export type FacturaPropietarioVistaPrevia = {
  propietario: { id: number; nombre: string; documento: string };
  /** YYYY-MM */
  periodo: string;
  lineas: FacturaPropietarioLineaPrevia[];
  total: string;
};

/** Línea de la factura del propietario que arma el modal: editable salvo el cargo y la tasa. */
export type FacturaPropietarioLinea = {
  cargo_id: number;
  tasa_iva: number;
  descripcion: string;
  monto: number;
};

export type NotaCreditoPropietarioLineaPrevia = {
  detalle_id: number;
  descripcion: string;
  tasa_iva: number;
  /** Lo que queda de la línea de la factura. */
  tope: string;
  /** Lo que sobra de su alquiler, para precargar el importe. */
  importe: string;
};

export type NotaCreditoPropietarioVistaPrevia = {
  propietario: { id: number; nombre: string; documento: string };
  factura_id: number;
  numero: string;
  timbrado_proveedor: string;
  /** YYYY-MM-DD */
  fecha: string;
  /** Saldo abierto de la factura: lo que la NC puede aplicar a su cuota. */
  saldo: string;
  lineas: NotaCreditoPropietarioLineaPrevia[];
};

export type FacturaDelPropietarioNotaRow = {
  id: number;
  numero: string;
  /** YYYY-MM-DD */
  fecha: string;
  total: string;
  estado: CompraEstado;
  tiene_aplicaciones_activas: boolean;
};

/** Factura que emitió el propietario por sus alquileres, registrada como compra. */
export type FacturaDelPropietarioRow = {
  id: number;
  numero: string;
  timbrado_proveedor: string;
  /** YYYY-MM-DD */
  fecha: string;
  condicion: CompraCondicion;
  total: string;
  saldo: string;
  estado: CompraEstado;
  notas: FacturaDelPropietarioNotaRow[];
};

export type CompensacionEstado = "ACTIVA" | "ANULADA";

export const COMPENSACION_ESTADO_LABEL: Record<CompensacionEstado, string> = {
  ACTIVA: "Activa",
  ANULADA: "Anulada",
};

export const COMPENSACION_ESTADO_COLOR: Record<CompensacionEstado, string> = {
  ACTIVA: "green",
  ANULADA: "default",
};

/** Lo que una compensación cerró de una factura: la que se le emitió al propietario (VENTA) o la que emitió él (COMPRA). */
export type CompensacionAplicacion = {
  lado: "VENTA" | "COMPRA";
  documento_id: number;
  numero: string | null;
  monto: string;
};

export type Compensacion = {
  id: number;
  /** YYYY-MM-DD */
  fecha: string;
  monto: string;
  estado: CompensacionEstado;
  motivo_anulacion: string | null;
  /** Transferencia de la que salió; null si no nació al transferir. */
  transferencia: { id: number; numero: number } | null;
  aplicaciones: CompensacionAplicacion[];
};
