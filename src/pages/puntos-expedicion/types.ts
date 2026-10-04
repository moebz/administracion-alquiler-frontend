export type PuntoExpedicionRow = {
  id: number;
  establecimiento_id: number;
  establecimiento: { id: number; codigo: string; nombre: string };
  codigo: string;
  codigo_completo: string;
  descripcion: string | null;
  is_active: boolean;
  fecha_baja: string | null;
};
