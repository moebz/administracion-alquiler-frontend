export type GastoTipo = "EXPENSA" | "REPARACION" | "SERVICIO" | "OTRO";

export const GASTO_TIPO_OPTIONS: { label: string; value: GastoTipo }[] = [
  { label: "Expensa", value: "EXPENSA" },
  { label: "Reparación", value: "REPARACION" },
  { label: "Servicio", value: "SERVICIO" },
  { label: "Otro", value: "OTRO" },
];

export const GASTO_TIPO_LABEL: Record<GastoTipo, string> = {
  EXPENSA: "Expensa",
  REPARACION: "Reparación",
  SERVICIO: "Servicio",
  OTRO: "Otro",
};

export type GastoEstado = "SOLICITADO" | "APROBADO" | "RECHAZADO" | "PAGADO" | "RECUPERADO" | "ANULADO";

export const GASTO_ESTADO_OPTIONS: { label: string; value: GastoEstado }[] = [
  { label: "Solicitado", value: "SOLICITADO" },
  { label: "Aprobado", value: "APROBADO" },
  { label: "Rechazado", value: "RECHAZADO" },
  { label: "Pagado", value: "PAGADO" },
  { label: "Recuperado", value: "RECUPERADO" },
  { label: "Anulado", value: "ANULADO" },
];

export const GASTO_ESTADO_LABEL: Record<GastoEstado, string> = {
  SOLICITADO: "Solicitado",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  PAGADO: "Pagado",
  RECUPERADO: "Recuperado",
  ANULADO: "Anulado",
};

export const GASTO_ESTADO_COLOR: Record<GastoEstado, string> = {
  SOLICITADO: "gold",
  APROBADO: "green",
  RECHAZADO: "red",
  PAGADO: "blue",
  RECUPERADO: "cyan",
  ANULADO: "default",
};

export type ACargoDe = "PROPIETARIO" | "INQUILINO" | "ADMINISTRADORA";

// ADMINISTRADORA existe a nivel de modelo (un gasto que la administradora
// absorbe sin cobrárselo a nadie, ver MODELO_DATOS.md "Gastos") pero no se
// ofrece todavía como opción de carga manual acá — por ahora el alta/edición
// de gastos solo admite Propietario o Inquilino.
export const A_CARGO_DE_OPTIONS: { label: string; value: ACargoDe }[] = [
  { label: "Propietario", value: "PROPIETARIO" },
  { label: "Inquilino", value: "INQUILINO" },
];

export const A_CARGO_DE_LABEL: Record<ACargoDe, string> = {
  PROPIETARIO: "Propietario",
  INQUILINO: "Inquilino",
  ADMINISTRADORA: "Administradora",
};

export type AprobadoPor = "ADMINISTRADORA" | "PROPIETARIO";

export const APROBADO_POR_OPTIONS: { label: string; value: AprobadoPor }[] = [
  { label: "Administradora", value: "ADMINISTRADORA" },
  { label: "Propietario", value: "PROPIETARIO" },
];

export type CargoGasto = {
  id: number;
  tipo: "EXPENSA" | "OTRO";
  monto: number | string;
  saldo: number | string;
  fecha_vencimiento: string;
  estado: "PENDIENTE" | "PARCIAL" | "VENCIDO" | "PAGADO" | "ANULADO";
  facturado: number | string;
};

// CREAR: se crea solo. CONFIRMAR: contrato terminado, solo si el usuario lo tilda. YA_TUVO: el gasto ya tuvo cargo.
// BLOQUEADO: contrato anulado, no se puede registrar la factura.
export type CargoPrevisto = {
  estado: "CREAR" | "CONFIRMAR" | "YA_TUVO" | "BLOQUEADO";
  tipo: "EXPENSA" | "OTRO";
  monto: number | string;
  inquilino: string;
  fecha_vencimiento: string;
  contrato_situacion: "FUTURO" | "VIGENTE" | "FINALIZADO" | "RESCINDIDO" | "ANULADO";
};

export type GastoRow = {
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
  };
  contrato_id: number | null;
  tipo: GastoTipo;
  descripcion: string;
  fecha: string;
  periodo: string | null;
  // Serializado como string: `monto` tiene cast `decimal:4` en el modelo (App\Models\Gasto), y Laravel siempre
  // manda un decimal como string en el JSON (no como number) para no perder precisión.
  monto: number | string;
  proveedor_id: number;
  proveedor: { id: number; nombre: string };
  a_cargo_de: ACargoDe;
  requiere_aprobacion: boolean;
  estado: GastoEstado;
  aprobado_por: AprobadoPor | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  documento_compra_id: number | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  cargo: CargoGasto | null;
  cargo_previsto: CargoPrevisto | null;
  documento_compra: {
    id: number;
    numero: string;
    timbrado_proveedor: string;
    estado: "REGISTRADO" | "ANULADO";
    saldo: number | string;
  } | null;
};
