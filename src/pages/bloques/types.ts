export type BloqueRow = {
  id: number;
  edificio_id: number;
  edificio: { id: number; nombre: string };
  nombre: string;
  capacidad_dptos: number | null;
  anio_construccion: number | null;
  is_active: boolean;
  fecha_baja: string | null;
};
