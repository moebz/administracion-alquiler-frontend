export type ProveedorRow = {
  id: number;
  nombre: string;
  persona: {
    id: number;
    tipo_documento_id: number;
    documento: string;
    nombre: string;
    telefono: string | null;
    email_contacto: string | null;
  };
  rubros: { id: number; nombre: string }[];
  is_active: boolean;
  fecha_baja: string | null;
};
