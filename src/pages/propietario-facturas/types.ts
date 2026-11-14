export type FacturaPropietarioTipo = "FACTURA" | "NOTA_CREDITO";

export type FacturaPropietarioEstado = "EMITIDO" | "ANULADO";

export const FACTURA_PROPIETARIO_TIPO_LABEL: Record<FacturaPropietarioTipo, string> = {
  FACTURA: "Factura",
  NOTA_CREDITO: "Nota de crédito",
};

export const FACTURA_PROPIETARIO_ESTADO_LABEL: Record<FacturaPropietarioEstado, string> = {
  EMITIDO: "Emitida",
  ANULADO: "Anulada",
};

export const FACTURA_PROPIETARIO_ESTADO_COLOR: Record<FacturaPropietarioEstado, string> = {
  EMITIDO: "green",
  ANULADO: "default",
};

/** Una fila del listado de facturas y NC que la administradora le emitió al propietario. */
export type FacturaPropietario = {
  id: number;
  tipo: FacturaPropietarioTipo;
  /** Número impreso, 001-001-0000123. */
  numero: string;
  /** YYYY-MM-DD */
  fecha: string;
  total: string;
  estado: FacturaPropietarioEstado;
  /** ISO 8601; solo si está anulada. */
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  /** Número impreso de la factura que corrige; solo en una NC. */
  factura_asociada: string | null;
};
