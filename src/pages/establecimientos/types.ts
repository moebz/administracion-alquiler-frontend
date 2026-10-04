export type EstablecimientoRow = {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string | null;
  is_active: boolean;
  fecha_baja: string | null;
};
