import type { Reintegro } from "../gastos/types";

// Único estado que ve el propietario: la aprobación mientras es lo que él decide, y después el reintegro, sin nada del
// pago al proveedor (que al propietario no le importa). Lo calcula el backend (Propietario\GastoController::estadoPortal()).
export type GastoEstadoPortal =
  | "PENDIENTE_APROBACION"
  | "RECHAZADO"
  | "ANULADO"
  | "APROBADO"
  | "A_REINTEGRAR"
  | "REINTEGRADO_PARCIAL"
  | "REINTEGRADO"
  | "ABSORBIDO";

export const GASTO_ESTADO_PORTAL_LABEL: Record<GastoEstadoPortal, string> = {
  PENDIENTE_APROBACION: "Pendiente de tu aprobación",
  RECHAZADO: "Rechazado",
  ANULADO: "Anulado",
  APROBADO: "Aprobado",
  A_REINTEGRAR: "A reintegrar",
  REINTEGRADO_PARCIAL: "Reintegrado en parte",
  REINTEGRADO: "Reintegrado",
  ABSORBIDO: "Absorbido por la administradora",
};

export const GASTO_ESTADO_PORTAL_COLOR: Record<GastoEstadoPortal, string> = {
  PENDIENTE_APROBACION: "gold",
  RECHAZADO: "red",
  ANULADO: "default",
  APROBADO: "green",
  A_REINTEGRAR: "orange",
  REINTEGRADO_PARCIAL: "blue",
  REINTEGRADO: "green",
  ABSORBIDO: "default",
};

export const GASTO_ESTADO_PORTAL_OPTIONS: { label: string; value: GastoEstadoPortal }[] = (
  Object.keys(GASTO_ESTADO_PORTAL_LABEL) as GastoEstadoPortal[]
).map((value) => ({ label: GASTO_ESTADO_PORTAL_LABEL[value], value }));

export type GastoPropietarioRow = {
  id: number;
  unidad: { id: number; numero: string; bloque: { id: number; nombre: string; edificio: { id: number; nombre: string } } };
  tipo: "EXPENSA" | "REPARACION" | "SERVICIO" | "OTRO";
  descripcion: string;
  fecha: string;
  monto: number | string;
  proveedor: { id: number; nombre: string };
  estado: "SOLICITADO" | "APROBADO" | "RECHAZADO" | "PAGADO" | "ANULADO";
  fecha_aprobacion: string | null;
  estado_portal: GastoEstadoPortal;
  reintegro: Reintegro;
};
