import type { PersonaUsuario } from "./account-status";

export type TipoPersona = "FISICA" | "JURIDICA";

export const TIPO_PERSONA_OPTIONS: { label: string; value: TipoPersona }[] = [
  { label: "Física", value: "FISICA" },
  { label: "Jurídica", value: "JURIDICA" },
];

export const TIPO_PERSONA_LABEL: Record<TipoPersona, string> = {
  FISICA: "Física",
  JURIDICA: "Jurídica",
};

export type PersonaRow = {
  id: number;
  tipo_identificacion_id: number;
  tipo_identificacion: { id: number; nombre: string };
  documento: string;
  dv: string | null;
  tipo_persona: TipoPersona;
  es_contribuyente: boolean;
  nombre: string;
  direccion: string | null;
  ciudad_id: number | null;
  ciudad: { id: number; nombre: string } | null;
  telefono: string | null;
  email_contacto: string | null;
  is_active: boolean;
  fecha_baja: string | null;
  roles: string[];
  usuario: PersonaUsuario;
};
