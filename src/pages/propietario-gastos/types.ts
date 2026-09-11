import type { GastoEstado } from "../gastos/types";

// Mismos estados que GASTO_ESTADO_LABEL (pages/gastos/types.ts), pero con
// textos pensados desde el punto de vista del propietario, no de la
// administradora: PAGADO significa "la administradora ya le pagó al
// proveedor", no que el propietario ya saldó algo (recién se lo descuenta en
// su próxima liquidación) — y RECUPERADO es justamente ese descuento ya
// hecho. Con las etiquetas de admin (pensadas para quien paga primero) un
// propietario podía leer "Pagado" como "ya pagué esto".
export const GASTO_ESTADO_LABEL_PROPIETARIO: Record<GastoEstado, string> = {
  SOLICITADO: "Pendiente de tu aprobación",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  PAGADO: "Pago a reintegrar a la administración",
  RECUPERADO: "Ya reintegrado",
  ANULADO: "Anulado",
};

export const GASTO_ESTADO_OPTIONS_PROPIETARIO: { label: string; value: GastoEstado }[] = [
  { label: "Pendiente de tu aprobación", value: "SOLICITADO" },
  { label: "Aprobado", value: "APROBADO" },
  { label: "Rechazado", value: "RECHAZADO" },
  { label: "Pago a reintegrar a la administración", value: "PAGADO" },
  { label: "Ya reintegrado", value: "RECUPERADO" },
  { label: "Anulado", value: "ANULADO" },
];
