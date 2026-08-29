export type ContratoAlquilerEstado = "VIGENTE" | "VENCIDO" | "RESCINDIDO";

export const CONTRATO_ALQUILER_ESTADO_OPTIONS: { label: string; value: ContratoAlquilerEstado }[] = [
  { label: "Vigente", value: "VIGENTE" },
  { label: "Vencido", value: "VENCIDO" },
  { label: "Rescindido", value: "RESCINDIDO" },
];

export const CONTRATO_ALQUILER_ESTADO_LABEL: Record<ContratoAlquilerEstado, string> = {
  VIGENTE: "Vigente",
  VENCIDO: "Vencido",
  RESCINDIDO: "Rescindido",
};

export const CONTRATO_ALQUILER_ESTADO_COLOR: Record<ContratoAlquilerEstado, string> = {
  VIGENTE: "green",
  VENCIDO: "gold",
  RESCINDIDO: "red",
};

export type ExpensasACargo = "PROPIETARIO" | "INQUILINO";

export const EXPENSAS_A_CARGO_OPTIONS: { label: string; value: ExpensasACargo }[] = [
  { label: "Propietario", value: "PROPIETARIO" },
  { label: "Inquilino", value: "INQUILINO" },
];

export const EXPENSAS_A_CARGO_LABEL: Record<ExpensasACargo, string> = {
  PROPIETARIO: "Propietario",
  INQUILINO: "Inquilino",
};

export type ContratoAlquilerRow = {
  id: number;
  unidad_id: number;
  unidad: {
    id: number;
    numero: string;
    bloque: {
      id: number;
      nombre: string;
      edificio: { id: number; nombre: string };
    };
    propietario: { id: number; nombre: string };
  };
  inquilino_id: number;
  inquilino: { id: number; nombre: string };
  fecha_inicio: string;
  fecha_fin: string;
  monto_alquiler: number;
  deposito: number | null;
  porcentaje_comision: number;
  porcentaje_mora_diario: number;
  dia_vencimiento: number;
  expensas_a_cargo: ExpensasACargo;
  estado: ContratoAlquilerEstado;
  fecha_rescision: string | null;
};
