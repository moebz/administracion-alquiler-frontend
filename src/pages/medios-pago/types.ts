export type MedioPagoRow = {
  id: number;
  codigo: string;
  nombre: string;
  requiere_datos_bancarios: boolean;
  is_active: boolean;
  fecha_baja: string | null;
};
