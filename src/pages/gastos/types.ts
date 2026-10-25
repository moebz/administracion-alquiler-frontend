import type { AccionSugerida, CargoDeudor, CargoMarca } from "../cargos/types";

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

export type GastoEstado = "SOLICITADO" | "APROBADO" | "RECHAZADO" | "PAGADO" | "ANULADO";

export const GASTO_ESTADO_OPTIONS: { label: string; value: GastoEstado }[] = [
  { label: "Solicitado", value: "SOLICITADO" },
  { label: "Aprobado", value: "APROBADO" },
  { label: "Rechazado", value: "RECHAZADO" },
  { label: "Pagado", value: "PAGADO" },
  { label: "Anulado", value: "ANULADO" },
];

export const GASTO_ESTADO_LABEL: Record<GastoEstado, string> = {
  SOLICITADO: "Solicitado",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  PAGADO: "Pagado",
  ANULADO: "Anulado",
};

export const GASTO_ESTADO_COLOR: Record<GastoEstado, string> = {
  SOLICITADO: "gold",
  APROBADO: "green",
  RECHAZADO: "red",
  PAGADO: "blue",
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
  deudor: CargoDeudor;
  tipo: "EXPENSA" | "OTRO";
  descripcion: string;
  monto: number | string;
  tasa_iva: 0 | 5 | 10;
  saldo: number | string;
  // Null en el cargo al propietario: no se le reclama el pago.
  fecha_vencimiento: string | null;
  estado: "PENDIENTE" | "PARCIAL" | "VENCIDO" | "PAGADO" | "ANULADO";
  facturado: number | string;
  cobrado: number | string;
  marca: CargoMarca | null;
  // Solo con la marca REVISAR_FACTURA.
  accion_sugerida: AccionSugerida | null;
};

// CREAR: el gasto nunca tuvo cargos, se crean solos, uno por línea de la factura. `monto` es el total del gasto,
// que se reparte entre los cargos según las líneas de la factura.
// REHACER: tiene `cargos_activos` sin facturar (p. ej. tras anular la factura del proveedor): se anulan y se crea uno por línea nueva.
// REVISAR_FACTURA: algún cargo activo ya está facturado, no se toca ninguno; `cargos_facturados` son esos cargos, y si las
// líneas de la factura los cubren a todos (ver emparejarFacturados()) el modal avisa REAPUNTAR: pasan a apuntar a esas líneas.
// YA_TUVO: todos sus cargos se anularon, no se crean otros.
// BLOQUEADO: contrato anulado (solo al inquilino), no se puede registrar la factura.
// `contrato_terminado` es la fecha de fin del contrato del gasto si ya terminó: los cargos se crean igual, solo se avisa.
// Al propietario no le aplica el vencimiento ni el contrato.
export type CargoPrevisto = {
  estado: "CREAR" | "REHACER" | "REVISAR_FACTURA" | "YA_TUVO" | "BLOQUEADO";
  tipo: "EXPENSA" | "OTRO";
  monto: number | string;
  deudor: CargoDeudor;
  deudor_nombre: string;
  fecha_vencimiento: string | null;
  contrato_terminado: string | null;
  cargos_activos: number;
  cargos_facturados: { id: number; descripcion: string; monto: number | string; tasa_iva: 0 | 5 | 10 }[];
};

// Lo que el modal le manda al backend como `cargos_esperado`: el aviso que mostró (NINGUNO si el gasto no genera cargos).
export type CargosEsperado = "CREAR" | "REHACER" | "REVISAR_FACTURA" | "REAPUNTAR" | "YA_TUVO" | "NINGUNO";

// Cuánto le devolvió el deudor a la administradora, aparte del pago al proveedor (`estado` del gasto).
export type ReintegroEstado = "PENDIENTE_FACTURA_PROVEEDOR" | "PENDIENTE" | "PARCIAL" | "REINTEGRADO" | "NO_APLICA";

export type Reintegro = {
  estado: ReintegroEstado;
  reintegrado: number | string;
  // Σ montos de los cargos activos: lo que tiene que volver.
  base: number | string;
  // Lo que puso la administradora (total de la factura vigente − base); null si no corresponde.
  absorbido: number | string | null;
};

export const REINTEGRO_LABEL: Record<ReintegroEstado, string> = {
  PENDIENTE_FACTURA_PROVEEDOR: "Pendiente factura proveedor",
  PENDIENTE: "Pendiente reintegro",
  PARCIAL: "Reintegro parcial",
  REINTEGRADO: "Reintegrado",
  NO_APLICA: "No aplica",
};

export const REINTEGRO_COLOR: Record<ReintegroEstado, string> = {
  PENDIENTE_FACTURA_PROVEEDOR: "default",
  PENDIENTE: "gold",
  PARCIAL: "blue",
  REINTEGRADO: "green",
  NO_APLICA: "default",
};

export const REINTEGRO_OPTIONS: { label: string; value: ReintegroEstado }[] = (
  Object.keys(REINTEGRO_LABEL) as ReintegroEstado[]
).map((value) => ({ label: REINTEGRO_LABEL[value], value }));

export const APROBADO_POR_LABEL: Record<AprobadoPor, string> = {
  ADMINISTRADORA: "Administradora",
  PROPIETARIO: "Propietario",
};

// Gasto por el que pasó un anticipo: su factura del proveedor se anuló y espera reemplazo, el gasto se anuló, o ya tiene el reemplazo.
export type AnticipoOrigenSituacion = "ESPERA_REEMPLAZO" | "ANULADO" | "REEMPLAZADA";

// Pago ya hecho al proveedor del gasto con saldo sin aplicar. `tildado` dice si se ofrece elegido al registrar la factura;
// `aviso` es que usarlo obligaría a pagar de nuevo la factura de reemplazo de otro gasto que la espera.
export type AnticipoProveedor = {
  id: number;
  numero: number;
  fecha: string;
  saldo: number | string;
  historial: { gasto_id: number; descripcion: string; unidad: string; situacion: AnticipoOrigenSituacion }[];
  tildado: boolean;
  aviso: boolean;
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
  // Fijo desde que pasó a APROBADO: tope de "Editar monto". Null mientras está SOLICITADO.
  monto_aprobado: number | string | null;
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
  cargos: CargoGasto[];
  cargo_previsto: CargoPrevisto | null;
  reintegro: Reintegro;
  // Solo en el detalle, con cargos marcados "Factura anulada" y factura vigente: cuántos se anulan y cuántas líneas los rehacen.
  rehacer_cargos: { habilitado: boolean; cargos: number; lineas: number } | null;
  // Solo mientras el gasto está aprobado y sin factura; [] en el resto.
  anticipos_proveedor: AnticipoProveedor[];
  documento_compra: {
    id: number;
    numero: string;
    timbrado_proveedor: string;
    estado: "REGISTRADO" | "ANULADO";
    saldo: number | string;
  } | null;
};
