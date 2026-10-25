import type { CargoTipo } from "../cargos/types";

export type CobroEstado = "ACTIVO" | "ANULADO";

export const COBRO_ESTADO_LABEL: Record<CobroEstado, string> = {
  ACTIVO: "Activo",
  ANULADO: "Anulado",
};

export const COBRO_ESTADO_COLOR: Record<CobroEstado, string> = {
  ACTIVO: "green",
  ANULADO: "default",
};

export const COBRO_ESTADO_OPTIONS: { label: string; value: CobroEstado }[] = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Anulado", value: "ANULADO" },
];

export type CobroValorRow = {
  id: number;
  medio_pago: { id: number; nombre: string };
  fondo: { id: number; nombre: string };
  monto: number | string;
  nro_comprobante: string | null;
  estado: "ACTIVO" | "ANULADO";
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};

export type CobroAplicacionRow = {
  id: number;
  cuota_id: number;
  documento_venta_id: number;
  numero_factura: string | null;
  numero_cuota: number;
  monto_aplicado: number | string;
  estado: "ACTIVA" | "ANULADA";
  valor_anulado_id: number | null;
};

export type CobroFacturaDetalleRow = {
  id: number;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string;
  tasa_iva: 0 | 5 | 10;
  subtotal: number | string;
  cargo_id: number | null;
};

export type CobroFacturaRow = {
  id: number;
  // Número impreso (001-001-0000001).
  numero: string | null;
  fecha: string;
  estado: "BORRADOR" | "EMITIDO" | "ANULADO";
  // False en una factura que ya estaba abierta (por ejemplo, la de un cobro anulado) y este cobro solo saldó.
  emitida_por_este_cobro: boolean;
  // Desde acá corre el plazo de 48 h para anularla (por ahora, el momento en que se emitió).
  fecha_aprobacion_sifen: string | null;
  // Null si se puede anular; si no, por qué (cobro aplicado, plazo vencido, ya anulada).
  motivo_no_anulable: string | null;
  saldo: number | string;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  exentas: number | string;
  gravadas_5: number | string;
  gravadas_10: number | string;
  iva_5: number | string;
  iva_10: number | string;
  total: number | string;
  detalles: CobroFacturaDetalleRow[];
};

export type CobroRow = {
  id: number;
  numero: number;
  persona_id: number;
  persona: { id: number; nombre: string };
  fecha: string;
  concepto: string | null;
  monto_total: number | string;
  estado: CobroEstado;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  // Unidad de los cargos cubiertos; null si ninguna factura tiene cargos.
  unidad: string | null;
  // Facturas a las que se aplica el cobro, en el orden de sus aplicaciones.
  facturas: CobroFacturaRow[];
  valores: CobroValorRow[];
  aplicaciones: CobroAplicacionRow[];
};

// Fila de la vista previa del cobro: un cargo por facturar, la mora del día de un alquiler vencido (cargo_id null,
// todavía sin guardar) o una factura al inquilino abierta (documento_venta_id, sin tipo, período ni tasa).
export type CobroVistaPreviaItem = {
  cargo_id: number | null;
  tipo: CargoTipo | null;
  descripcion: string;
  periodo: string | null;
  fecha_vencimiento: string;
  vencido: boolean;
  tasa_iva: 0 | 5 | 10 | null;
  // Lo que falta facturar del cargo, o el saldo de la cuota de la factura abierta.
  saldo: string;
  // Total que cubre el cobro si llega hasta esta fila.
  acumulado: string;
  documento_venta_id: number | null;
  // Número impreso de la factura abierta.
  numero_factura: string | null;
};

export type CobroVistaPreviaExcluido = {
  cargo_id: number;
  tipo: CargoTipo;
  descripcion: string;
  periodo: string;
  saldo: string;
};

export type CobroVistaPrevia = {
  contrato: { id: number; inquilino: { id: number; nombre: string }; unidad: string };
  fecha: string;
  items: CobroVistaPreviaItem[];
  excluidos: CobroVistaPreviaExcluido[];
};

export type PuntoExpedicionOpcion = { id: number; etiqueta: string };
