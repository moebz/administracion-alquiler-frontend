export type EdificioRow = {
  id: number;
  nombre: string;
  direccion: string;
  superficie_m2: number | null;
  tiene_estacionamiento: boolean;
  bloques_count: number;
  comodidades: { id: number; nombre: string }[];
  is_active: boolean;
  fecha_baja: string | null;
};
