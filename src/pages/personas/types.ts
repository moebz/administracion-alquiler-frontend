import type { PersonaUsuario } from "./account-status";

export type PersonaRow = {
  id: number;
  tipo_documento_id: number;
  tipo_documento: { id: number; nombre: string };
  documento: string;
  nombre: string;
  telefono: string | null;
  email_contacto: string | null;
  is_active: boolean;
  fecha_baja: string | null;
  roles: string[];
  usuario: PersonaUsuario;
};
