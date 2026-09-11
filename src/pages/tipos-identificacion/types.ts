export type TipoIdentificacionRow = {
  id: number;
  codigo: string;
  nombre: string;
  codigo_sifen: string | null;
  is_active: boolean;
  fecha_baja: string | null;
};
