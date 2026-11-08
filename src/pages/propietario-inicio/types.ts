import type { CuentaCorrienteMovimiento, PorDocumentar } from "../cuentas-corrientes/types";
import type { SolicitudTransferencia } from "../solicitudes-transferencia/types";

/** Respuesta de `GET /propietario/inicio`. */
export type PropietarioInicioDatos = {
  /** Su saldo a hoy: lo que puede pedir, liquidado o no. */
  disponible: string;
  /** Movimientos que vencen después de hoy, con el saldo acumulado desde `disponible`. */
  por_vencer: CuentaCorrienteMovimiento[];
  /** Lo que le falta emitir a hoy. */
  por_documentar: PorDocumentar;
  /** Su solicitud de transferencia más reciente (la pendiente, si tiene); null si nunca pidió. */
  solicitud: SolicitudTransferencia | null;
  /** Gastos SOLICITADO a su cargo; solo viene con `gastos.aprobar_propio`. */
  gastos_pendientes?: number;
};
