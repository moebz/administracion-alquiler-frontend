export type PagoProveedorEstado = "ACTIVO" | "ANULADO";

export const PAGO_PROVEEDOR_ESTADO_LABEL: Record<PagoProveedorEstado, string> = {
  ACTIVO: "Activo",
  ANULADO: "Anulado",
};

export const PAGO_PROVEEDOR_ESTADO_COLOR: Record<PagoProveedorEstado, string> = {
  ACTIVO: "green",
  ANULADO: "default",
};

export const PAGO_PROVEEDOR_ESTADO_OPTIONS: { label: string; value: PagoProveedorEstado }[] = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Anulado", value: "ANULADO" },
];

export type PagoProveedorValorRow = {
  id: number;
  medio_pago: { id: number; nombre: string };
  fondo: { id: number; nombre: string };
  monto: number | string;
  nro_comprobante: string | null;
  estado: "ACTIVO" | "ANULADO";
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};

export type PagoProveedorAplicacionRow = {
  id: number;
  cuota_id: number;
  documento_compra_id: number;
  documento_compra_numero: string;
  monto_aplicado: number | string;
  estado: "ACTIVA" | "ANULADA";
  valor_anulado_id: number | null;
};

export type PagoProveedorRow = {
  id: number;
  numero: number;
  persona_id: number;
  persona: { id: number; nombre: string };
  fecha: string;
  concepto: string | null;
  monto_total: number | string;
  estado: PagoProveedorEstado;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  valores: PagoProveedorValorRow[];
  aplicaciones: PagoProveedorAplicacionRow[];
};
