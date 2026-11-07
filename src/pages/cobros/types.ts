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

// Uso del saldo a favor de una NC al inquilino en este cobro, contra la cuota de una factura.
export type CobroNotaCreditoRow = {
  id: number;
  // NC cuyo saldo a favor se usó.
  documento_venta_id: number;
  numero_nc: string | null;
  cuota_id: number;
  factura_id: number;
  numero_factura: string | null;
  monto_aplicado: number | string;
  estado: "ACTIVA" | "ANULADA";
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};

export type CobroFacturaDetalleRow = {
  id: number;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string;
  tasa_iva: 0 | 5 | 10;
  subtotal: number | string;
  cargo_id: number | null;
  // Lo que una NC nueva puede acreditar de la línea; null en una línea sin cargo (no se acredita).
  tope_nc: number | string | null;
};

export type NotaCreditoEstado = "EMITIDO" | "ANULADO";

export const NOTA_CREDITO_ESTADO_LABEL: Record<NotaCreditoEstado, string> = {
  EMITIDO: "Emitida",
  ANULADO: "Anulada",
};

export const NOTA_CREDITO_ESTADO_COLOR: Record<NotaCreditoEstado, string> = {
  EMITIDO: "green",
  ANULADO: "default",
};

// Uso del saldo a favor de una NC contra la cuota de una factura al inquilino.
export type NotaCreditoAplicacionRow = {
  id: number;
  cuota_id: number;
  documento_venta_id: number;
  // Número impreso de la factura a la que se aplicó.
  numero_factura: string | null;
  // Lo que debe esa factura hoy, con esta aplicación si sigue activa.
  saldo_factura: number | string;
  // Cobro en el que se usó el saldo; null si se aplicó sola al emitir la NC.
  cobro_cliente_id: number | null;
  numero_cobro: number | null;
  monto_aplicado: number | string;
  estado: "ACTIVA" | "ANULADA";
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};

export type NotaCreditoLineaRow = {
  id: number;
  descripcion: string;
  subtotal: number | string;
  cargo_id: number | null;
};

// NC al inquilino que corrige una factura.
export type NotaCreditoRow = {
  id: number;
  // Número impreso (001-001-0000001).
  numero: string | null;
  fecha: string;
  total: number | string;
  estado: NotaCreditoEstado;
  motivo: string | null;
  // Desde acá corre el plazo de 168 h para anularla (por ahora, el momento en que se emitió).
  fecha_aprobacion_sifen: string | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  // Lo que queda por usar de la NC; 0 si está anulada.
  saldo_a_favor: number | string;
  // Null si se puede anular; si no, por qué (ya anulada, pasaron las 168 h).
  motivo_no_anulable: string | null;
  detalles: NotaCreditoLineaRow[];
  aplicaciones: NotaCreditoAplicacionRow[];
};

export type CobroFacturaRow = {
  id: number;
  // Número impreso (001-001-0000001).
  numero: string | null;
  fecha: string;
  estado: "BORRADOR" | "EMITIDO" | "ANULADO";
  // False en una factura que ya estaba abierta (por ejemplo, la de un cobro anulado) y este cobro solo saldó;
  // null cuando se muestra sin un cobro (la página propia de la factura).
  emitida_por_este_cobro: boolean | null;
  // Desde acá corre el plazo de 48 h para anularla (por ahora, el momento en que se emitió).
  fecha_aprobacion_sifen: string | null;
  // Null si se puede anular; si no, por qué (cobro aplicado, plazo vencido, ya anulada).
  motivo_no_anulable: string | null;
  saldo: number | string;
  // La factura de la comisión y el reintegro al propietario: no se le emite NC a mano.
  es_al_propietario: boolean;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  exentas: number | string;
  gravadas_5: number | string;
  gravadas_10: number | string;
  iva_5: number | string;
  iva_10: number | string;
  total: number | string;
  detalles: CobroFacturaDetalleRow[];
  // NC que corrigen la factura, de la más vieja a la más nueva.
  notas: NotaCreditoRow[];
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
  // Saldo a favor de NC al inquilino usado en este cobro.
  notas_credito: CobroNotaCreditoRow[];
};

// Respuesta de cobrar cuando el saldo a favor de las NC cubrió todo: no se registró cobro.
export type CobroSinCobroRespuesta = {
  cobro: null;
  // Facturas que el cobro cubre, la emitida primero.
  facturas_saldadas: number[];
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
  // Líneas que ya fijó la factura abierta; vacío en las filas de cargo.
  lineas: { descripcion: string; tasa_iva: 0 | 5 | 10; subtotal: string }[];
  // Número impreso de la factura abierta.
  numero_factura: string | null;
  // Cobro de la última aplicación anulada de la factura abierta (por qué quedó abierta), si lo hay.
  cobro_anulado_id: number | null;
};

export type CobroVistaPreviaExcluido = {
  cargo_id: number;
  tipo: CargoTipo;
  descripcion: string;
  periodo: string;
  saldo: string;
};

// NC emitida del contrato con saldo a favor, para usar en el cobro.
export type CobroSaldoAFavor = {
  id: number;
  numero: string | null;
  fecha: string;
  total: string;
  saldo_a_favor: string;
  // Factura que corrige la NC.
  factura: { id: number; numero: string | null };
};

export type CobroVistaPrevia = {
  contrato: { id: number; inquilino: { id: number; nombre: string }; unidad: string };
  fecha: string;
  items: CobroVistaPreviaItem[];
  excluidos: CobroVistaPreviaExcluido[];
  saldos_a_favor: CobroSaldoAFavor[];
};

export type PuntoExpedicionOpcion = { id: number; etiqueta: string };
