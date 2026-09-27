export type CompraCondicion = "CONTADO" | "CREDITO";

export const COMPRA_CONDICION_LABEL: Record<CompraCondicion, string> = {
  CONTADO: "Contado",
  CREDITO: "Crédito",
};

export const COMPRA_CONDICION_OPTIONS: { label: string; value: CompraCondicion }[] = [
  { label: "Contado", value: "CONTADO" },
  { label: "Crédito", value: "CREDITO" },
];

export type CompraEstado = "REGISTRADO" | "ANULADO";

export const COMPRA_ESTADO_LABEL: Record<CompraEstado, string> = {
  REGISTRADO: "Registrado",
  ANULADO: "Anulado",
};

export const COMPRA_ESTADO_COLOR: Record<CompraEstado, string> = {
  REGISTRADO: "green",
  ANULADO: "default",
};

export const COMPRA_ESTADO_OPTIONS: { label: string; value: CompraEstado }[] = [
  { label: "Registrado", value: "REGISTRADO" },
  { label: "Anulado", value: "ANULADO" },
];

export type CompraDetalleRow = {
  id: number;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string;
  tasa_iva: number;
  subtotal: number | string;
};

export type CompraCuotaPagoRow = {
  id: number;
  estado: "ACTIVA" | "ANULADA";
  monto_aplicado: number | string;
  pago_proveedor_id: number;
  pago_proveedor_numero: number;
};

export type CompraCuotaRow = {
  id: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto: number | string;
  saldo: number | string;
  pagos: CompraCuotaPagoRow[];
};

export type CompraRow = {
  id: number;
  tipo: "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO";
  persona_id: number;
  persona: { id: number; nombre: string };
  emisor_nombre: string;
  emisor_ruc: string;
  emisor_dv: string | null;
  numero: string;
  timbrado_proveedor: string;
  fecha: string;
  condicion: CompraCondicion;
  motivo: string | null;
  exentas: number | string;
  gravadas_5: number | string;
  gravadas_10: number | string;
  iva_5: number | string;
  iva_10: number | string;
  total: number | string;
  total_gs: number | string;
  saldo: number | string;
  estado: CompraEstado;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  detalles: CompraDetalleRow[];
  cuotas: CompraCuotaRow[];
};
