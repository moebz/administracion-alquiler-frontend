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
