import type { Balde, Baldes, Moneda, PersonaDelReporte, TotalesDeLado } from "../../components/reporte-de-antiguedad";
import type { CargoMarca } from "../cargos/types";

/** Documentos que llevan una deuda: los números de las facturas (o de la NC) y si falta facturar algo. */
export type DocumentosDeDeuda = {
  tipo: "FACTURA" | "NOTA_CREDITO";
  numeros: string[];
  sin_facturar: boolean;
};

export type CuentasPorCobrarDeudaTipo = "CARGO" | "MORA_A_HOY" | "COMISION" | "NC";

export type CuentasPorCobrarDeuda = {
  tipo: CuentasPorCobrarDeudaTipo;
  cargo_id: number | null;
  concepto: string;
  /** YYYY-MM; null en una NC. */
  periodo: string | null;
  unidades: string[];
  monto: string;
  /** Negativo en una NC con saldo a favor. */
  pendiente: string;
  documentos: DocumentosDeDeuda;
  marca: CargoMarca | null;
  /** YYYY-MM-DD */
  fecha_origen: string;
  /** YYYY-MM-DD; solo en la deuda del inquilino. */
  vence: string | null;
  /** Días desde el vencimiento; solo en la deuda del inquilino. */
  atraso: number | null;
  balde: Balde;
};

type GrupoBase = {
  clave: string;
  moneda: Moneda;
  baldes: Baldes;
  total: string;
  deudas: CuentasPorCobrarDeuda[];
};

/** Lo que debe un contrato, en una sola moneda. */
export type GrupoDeInquilino = GrupoBase & {
  contrato: { id: number; unidad: string; fecha_inicio: string; fecha_fin: string };
  persona: PersonaDelReporte;
};

/** Lo que se le cobra a un propietario hasta compensarlo, en una sola moneda. */
export type GrupoDePropietario = GrupoBase & {
  propietario: PersonaDelReporte;
  unidades: string[];
};

/** Totales de una moneda, por lado. */
export type TotalesDeMoneda = {
  moneda: Moneda;
  inquilinos: TotalesDeLado;
  propietarios: TotalesDeLado;
};

export type CuentasPorCobrarReporte = {
  /** YYYY-MM-DD */
  saldo_al: string;
  inquilinos: GrupoDeInquilino[];
  propietarios: GrupoDePropietario[];
  totales: TotalesDeMoneda[];
};

export type FiltrosCuentasPorCobrar = {
  edificioId?: number;
  unidadId?: number;
};
