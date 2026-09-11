export type EdificioRow = {
  id: number;
  nombre: string;
  ciudad_id: number;
  ciudad: { id: number; nombre: string };
  administracion_id: number | null;
  administracion: { id: number; nombre: string } | null;
  direccion: string;
  superficie_m2: number | null;
  tiene_estacionamiento: boolean;
  bloques_count: number;
  comodidades: { id: number; nombre: string }[];
  is_active: boolean;
  fecha_baja: string | null;
};
