export type TimbradoTipo = "PREIMPRESO" | "ELECTRONICO";
export type TipoComprobante = "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO";

export const TIMBRADO_TIPO_OPTIONS: { value: TimbradoTipo; label: string }[] = [
  { value: "PREIMPRESO", label: "Preimpreso" },
  { value: "ELECTRONICO", label: "Electrónico" },
];

export const TIPO_COMPROBANTE_OPTIONS: { value: TipoComprobante; label: string }[] = [
  { value: "FACTURA", label: "Factura" },
  { value: "NOTA_CREDITO", label: "Nota de crédito" },
  { value: "NOTA_DEBITO", label: "Nota de débito" },
];

export const NUMERO_MAXIMO = 9999999;

export type TimbradoRangoRow = {
  id: number;
  punto_expedicion_id: number;
  punto_expedicion: { id: number; codigo_completo: string };
  tipo_comprobante: TipoComprobante;
  tipo_comprobante_label: string;
  serie: string | null;
  numero_desde: number;
  numero_hasta: number;
  ultimo_numero: number;
  disponibles: number;
  usado: boolean;
};

export type TimbradoRow = {
  id: number;
  numero_timbrado: string;
  tipo: TimbradoTipo;
  tipo_label: string;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  vigente: boolean;
  is_active: boolean;
  fecha_baja: string | null;
  rangos: TimbradoRangoRow[];
};
