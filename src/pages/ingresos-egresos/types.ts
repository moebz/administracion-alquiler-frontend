import type { Moneda } from "../../components/reporte-de-antiguedad";

export type CategoriaClave = "COBROS" | "PAGOS_PROVEEDORES" | "TRANSFERENCIAS_PROPIETARIOS" | "ANULACIONES" | "OTROS";

/** De qué es el movimiento del fondo: de un cobro, de un pago o de otro origen. */
export type OrigenDelMovimiento = "COBRO" | "PAGO" | "OTRO";

/** Un movimiento de un fondo, o la anulación de uno. Los montos llegan como string, con signo. */
export type MovimientoDelReporte = {
  movimiento_id: number;
  /** YYYY-MM-DD; en una anulación, el día en que se anuló. */
  fecha: string;
  monto: string;
  fondo: { id: number; nombre: string };
  medio_pago: string | null;
  persona: { id: number; nombre: string } | null;
  origen: OrigenDelMovimiento;
  /** Número del cobro o del pago; null en otros movimientos. */
  numero: number | null;
  concepto: string | null;
  /** YYYY-MM-DD; solo si el movimiento hoy está anulado. */
  anulado_el: string | null;
  cobro_cliente_id: number | null;
  pago_proveedor_id: number | null;
  /** Solo en una anulación. */
  motivo?: string | null;
  /** YYYY-MM-DD; solo en una anulación: la fecha del movimiento que se anuló. */
  fecha_movimiento?: string;
};

export type CategoriaDelReporte = {
  clave: CategoriaClave;
  nombre: string;
  /** Con signo: los egresos y la anulación de un ingreso, en negativo. */
  total: string;
  movimientos: MovimientoDelReporte[];
};

/** Lo que entró y salió de los fondos en una moneda. */
export type MonedaDelReporte = {
  moneda: Moneda;
  saldo_inicial: string;
  categorias: CategoriaDelReporte[];
  neto: string;
  saldo_final: string;
};

export type IngresosEgresosReporte = {
  /** YYYY-MM-DD */
  desde: string;
  /** YYYY-MM-DD */
  hasta: string;
  monedas: MonedaDelReporte[];
};

/** Fila de la tabla de resumen de una moneda. */
export type FilaDeResumen = {
  key: string;
  tipo: "SALDO_INICIAL" | "CATEGORIA" | "NETO" | "SALDO_FINAL";
  etiqueta: string;
  monto: string;
  /** Solo en las filas de categoría: lo que se despliega. */
  categoria?: CategoriaDelReporte;
};

/** Permisos que deciden si un número o un nombre es un link o texto plano. */
export type PermisosDeEnlaces = {
  puedeVerCobros: boolean;
  puedeVerPagos: boolean;
  puedeVerCuenta: boolean;
};
