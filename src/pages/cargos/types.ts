export type CargoTipo = "ALQUILER" | "EXPENSA" | "MORA" | "OTRO";

export const CARGO_TIPO_LABEL: Record<CargoTipo, string> = {
  ALQUILER: "Alquiler",
  EXPENSA: "Expensa",
  MORA: "Mora",
  OTRO: "Otro",
};

export const CARGO_TIPO_OPTIONS: { label: string; value: CargoTipo }[] = [
  { label: "Alquiler", value: "ALQUILER" },
  { label: "Expensa", value: "EXPENSA" },
  { label: "Mora", value: "MORA" },
  { label: "Otro", value: "OTRO" },
];

// Solo estos dos se cargan a mano: EXPENSA viene de gastos y MORA se materializa al cobrar.
export const CARGO_TIPO_MANUAL_OPTIONS = CARGO_TIPO_OPTIONS.filter(
  (option) => option.value === "ALQUILER" || option.value === "OTRO",
);

export type CargoEstado = "PENDIENTE" | "PARCIAL" | "VENCIDO" | "PAGADO" | "ANULADO";

export const CARGO_ESTADO_OPTIONS: { label: string; value: CargoEstado }[] = [
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Parcial", value: "PARCIAL" },
  { label: "Vencido", value: "VENCIDO" },
  { label: "Pagado", value: "PAGADO" },
  { label: "Anulado", value: "ANULADO" },
];

export const CARGO_ESTADO_LABEL: Record<CargoEstado, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  VENCIDO: "Vencido",
  PAGADO: "Pagado",
  ANULADO: "Anulado",
};

export const CARGO_ESTADO_COLOR: Record<CargoEstado, string> = {
  PENDIENTE: "gold",
  PARCIAL: "blue",
  VENCIDO: "red",
  PAGADO: "green",
  ANULADO: "default",
};

export const CARGO_ESTADOS_PENDIENTES: CargoEstado[] = ["PENDIENTE", "PARCIAL", "VENCIDO"];

export type CargoRow = {
  id: number;
  contrato_id: number;
  contrato: {
    id: number;
    unidad: {
      id: number;
      numero: string;
      bloque: { id: number; nombre: string; edificio: { id: number; nombre: string } };
    };
    inquilino: { id: number; nombre: string };
  };
  tipo: CargoTipo;
  periodo: string;
  descripcion: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  // Serializados como string: cast `decimal:4` (App\Models\Cargo).
  monto: number | string;
  monto_descontado: number | string;
  facturado: number | string;
  saldo: number | string;
  dias_atraso: number;
  mora_al_dia: number | string;
  estado: CargoEstado;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};
