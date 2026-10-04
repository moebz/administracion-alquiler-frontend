export type ContratoAlquilerEstado = "FUTURO" | "VIGENTE" | "FINALIZADO" | "RESCINDIDO" | "ANULADO";

export const CONTRATO_ALQUILER_ESTADO_OPTIONS: { label: string; value: ContratoAlquilerEstado }[] = [
  { label: "Futuro", value: "FUTURO" },
  { label: "Vigente", value: "VIGENTE" },
  { label: "Finalizado", value: "FINALIZADO" },
  { label: "Rescindido", value: "RESCINDIDO" },
  { label: "Anulado", value: "ANULADO" },
];

export const CONTRATO_ALQUILER_ESTADO_LABEL: Record<ContratoAlquilerEstado, string> = {
  FUTURO: "Futuro",
  VIGENTE: "Vigente",
  FINALIZADO: "Finalizado",
  RESCINDIDO: "Rescindido",
  ANULADO: "Anulado",
};

export const CONTRATO_ALQUILER_ESTADO_COLOR: Record<ContratoAlquilerEstado, string> = {
  FUTURO: "blue",
  VIGENTE: "green",
  FINALIZADO: "gold",
  RESCINDIDO: "red",
  ANULADO: "default",
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
  // creando un reajuste, no editando el contrato. Serializado como string:
  // `monto_alquiler` tiene cast `decimal:4` (App\Models\ContratoReajuste).
  monto_alquiler_vigente: number | string | null;
  // Sin `deposito_garantia` acá a propósito: el depósito de garantía se saca
  // del front hasta que se pida explícitamente retomar ese desarrollo — ver
  // ARQUITECTURA.md. El backend lo sigue devolviendo; este tipo simplemente
  // no lo declara.
  // Serializados como string: cast `decimal:4` (App\Models\ContratoAlquiler).
  comision_pct: number | string;
  mora_pct_diario: number | string;
  mora_tope_pct: number | string | null;
  dia_vencimiento: number;
  dias_gracia: number;
  expensas_a_cargo_de: ExpensasACargo;
  // Derivado de las fechas en el backend (no se guarda).
  estado: ContratoAlquilerEstado;
  fecha_fin_efectiva: string;
  rescision_programada: boolean;
  fecha_rescision: string | null;
  motivo_rescision: string | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};
