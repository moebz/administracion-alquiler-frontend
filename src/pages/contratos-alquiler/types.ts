export type ContratoAlquilerEstado = "VIGENTE" | "FINALIZADO" | "RESCINDIDO";

export const CONTRATO_ALQUILER_ESTADO_OPTIONS: { label: string; value: ContratoAlquilerEstado }[] = [
  { label: "Vigente", value: "VIGENTE" },
  { label: "Finalizado", value: "FINALIZADO" },
  { label: "Rescindido", value: "RESCINDIDO" },
];

export const CONTRATO_ALQUILER_ESTADO_LABEL: Record<ContratoAlquilerEstado, string> = {
  VIGENTE: "Vigente",
  FINALIZADO: "Finalizado",
  RESCINDIDO: "Rescindido",
};

export const CONTRATO_ALQUILER_ESTADO_COLOR: Record<ContratoAlquilerEstado, string> = {
  VIGENTE: "green",
  FINALIZADO: "gold",
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
  // Calculado (App\Models\ContratoAlquiler::montoAlquilerVigente()): el
  // monto vive en contrato_reajustes, no en el contrato — se cambia
  // creando un reajuste, no editando el contrato.
  monto_alquiler_vigente: number | null;
  // Sin `deposito_garantia` acá a propósito: el depósito de garantía se saca
  // del front hasta que se pida explícitamente retomar ese desarrollo — ver
  // ARQUITECTURA.md. El backend lo sigue devolviendo; este tipo simplemente
  // no lo declara.
  comision_pct: number;
  mora_pct_diario: number;
  mora_tope_pct: number | null;
  dia_vencimiento: number;
  dias_gracia: number;
  expensas_a_cargo_de: ExpensasACargo;
  estado: ContratoAlquilerEstado;
  fecha_rescision: string | null;
  motivo_rescision: string | null;
};
