export type ConceptoRow = {
  id: number;
  codigo: string;
  descripcion: string;
  precio_unitario: string | null;
  tasa_iva: number | null;
  es_de_sistema: boolean;
  is_active: boolean;
  fecha_baja: string | null;
};

// Su tasa de IVA se copia a cada cargo de alquiler, así que no puede quedar vacía (ver Concepto::CODIGOS_ALQUILER en el backend).
export const CODIGOS_ALQUILER = ["ALQUILER_RESIDENCIAL", "ALQUILER_OTROS"];
