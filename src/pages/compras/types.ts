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
  // En la línea de una NC: la línea de la factura que corrige.
  detalle_ref_id: number | null;
  // Solo en las líneas de una factura: lo que todavía se puede acreditar con una NC (subtotal − NC registradas).
  tope_nc: number | string | null;
  // Solo en la factura del propietario y en su NC: el alquiler que documenta la línea.
  cargo_id: number | null;
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

// Uso del saldo a favor de una NC del proveedor contra una cuota; sin pago si se aplicó sola al registrar la NC.
export type CompraNotaAplicacionRow = {
  id: number;
  estado: "ACTIVA" | "ANULADA";
  monto_aplicado: number | string;
  cuota_id: number;
  numero_cuota: number;
  documento_compra_id: number;
  documento_compra_numero: string;
  pago_proveedor_id: number | null;
  pago_proveedor_numero: number | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};

// NC o ND del proveedor que corrige una factura (`notas` de la factura).
export type CompraNotaRow = {
  id: number;
  tipo: "NOTA_CREDITO" | "NOTA_DEBITO";
  numero: string;
  timbrado_proveedor: string;
  fecha: string;
  total: number | string;
  estado: CompraEstado;
  motivo: string | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  // Solo en una NC: total − aplicaciones activas.
  saldo_a_favor: number | string | null;
  detalles: Pick<CompraDetalleRow, "id" | "descripcion" | "tasa_iva" | "subtotal" | "detalle_ref_id">[];
  // Cuotas de la nota: una ND tiene una, una NC ninguna. Se pagan junto con las de la factura.
  cuotas: Pick<CompraCuotaRow, "id" | "numero_cuota" | "fecha_vencimiento" | "monto" | "saldo">[];
  aplicaciones: CompraNotaAplicacionRow[];
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
  // Solo en una factura: lo que vale con sus notas (total − NC + ND registradas) y lo que se le debe al proveedor.
  total_neto: number | string | null;
  saldo_al_proveedor: number | string | null;
  // Solo en una NC.
  saldo_a_favor: number | string | null;
  documento_ref_id: number | null;
  // Es la factura que emitió el propietario por sus alquileres, o una NC sobre ella.
  es_del_propietario: boolean;
  estado: CompraEstado;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  detalles: CompraDetalleRow[];
  notas: CompraNotaRow[];
  cuotas: CompraCuotaRow[];
};
