import type { Balde, Baldes, Moneda, PersonaDelReporte, TotalesDeLado } from "../../components/reporte-de-antiguedad";

/** Documentos que respaldan una deuda: los números del papel (factura, ND, NC o pago) y si falta la factura del alquiler. */
export type DocumentosDePago = {
  tipo: "FACTURA" | "NOTA_DEBITO" | "NOTA_CREDITO" | "PAGO";
  numeros: string[];
  sin_facturar: boolean;
};

export type CuentasPorPagarDeudaTipo = "CUOTA" | "NC" | "ANTICIPO" | "ALQUILER" | "TRANSFERENCIA";

export type CuentasPorPagarDeuda = {
  tipo: CuentasPorPagarDeudaTipo;
  /** Solo en el alquiler. */
  cargo_id: number | null;
  /** El gasto de la cuota o de la NC del proveedor, para el link. */
  gasto_id: number | null;
  /** El pago del anticipo o de la transferencia, para el link. */
  pago_proveedor_id: number | null;
  concepto: string;
  unidades: string[];
  /** Negativo en una NC, un anticipo o una transferencia. */
  monto: string;
  /** Negativo en una NC, un anticipo, una transferencia o un alquiler pagado de más. */
  pendiente: string;
  documentos: DocumentosDePago;
  /** YYYY-MM-DD; la fecha de la factura en una cuota. */
  fecha_origen: string;
  /** YYYY-MM-DD; solo en la cuota. */
  vence: string | null;
  /** Días desde el vencimiento; solo en la cuota. */
  atraso: number | null;
  balde: Balde;
};

type GrupoBase = {
  clave: string;
  unidades: string[];
  moneda: Moneda;
  baldes: Baldes;
  total: string;
  deudas: CuentasPorPagarDeuda[];
};

/** Lo que se le debe a un proveedor, en una sola moneda. */
export type GrupoDeProveedor = GrupoBase & {
  proveedor: PersonaDelReporte;
};

/** Lo que se le debe a un propietario, en una sola moneda. */
export type GrupoDePropietario = GrupoBase & {
  propietario: PersonaDelReporte;
  /** Monto de las transferencias sin aplicar que el filtro dejó afuera; null sin filtro o si no hay. */
  transferencias_fuera_del_filtro: string | null;
};

/** Totales de una moneda, por lado. */
export type TotalesDeMoneda = {
  moneda: Moneda;
  proveedores: TotalesDeLado;
  propietarios: TotalesDeLado;
};

export type CuentasPorPagarReporte = {
  /** YYYY-MM-DD */
  saldo_al: string;
  proveedores: GrupoDeProveedor[];
  propietarios: GrupoDePropietario[];
  totales: TotalesDeMoneda[];
};

export type FiltrosCuentasPorPagar = {
  edificioId?: number;
  unidadId?: number;
};

/** Permisos que deciden si el documento de una deuda es un link o texto plano. */
export type PermisosDeEnlaces = {
  puedeVerGastos: boolean;
  puedeVerPagos: boolean;
};
