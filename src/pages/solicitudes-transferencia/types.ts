export type SolicitudTransferenciaEstado = "PENDIENTE" | "TRANSFERIDA" | "RECHAZADA" | "CANCELADA";

export const SOLICITUD_TRANSFERENCIA_ESTADO_LABEL: Record<SolicitudTransferenciaEstado, string> = {
  PENDIENTE: "Pendiente",
  TRANSFERIDA: "Transferida",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

export const SOLICITUD_TRANSFERENCIA_ESTADO_COLOR: Record<SolicitudTransferenciaEstado, string> = {
  PENDIENTE: "orange",
  TRANSFERIDA: "green",
  RECHAZADA: "red",
  CANCELADA: "default",
};

export const SOLICITUD_TRANSFERENCIA_ESTADO_OPTIONS = (
  Object.keys(SOLICITUD_TRANSFERENCIA_ESTADO_LABEL) as SolicitudTransferenciaEstado[]
).map((estado) => ({ value: estado, label: SOLICITUD_TRANSFERENCIA_ESTADO_LABEL[estado] }));

export type CuentaBancaria = { id: number; banco: string; numero_cuenta: string };

/** Solicitud de transferencia resumida, igual para el portal y para el panel interno. Los montos llegan como string. */
export type SolicitudTransferencia = {
  id: number;
  /** Fecha y hora del pedido (ISO). */
  fecha: string;
  /** Lo que pidió el propietario. */
  monto: string;
  estado: SolicitudTransferenciaEstado;
  motivo_rechazo: string | null;
  /** Fecha y hora en que se transfirió, rechazó o canceló (ISO). */
  fecha_resolucion: string | null;
  /** Cuenta donde pidió recibirla; null si no tenía cuentas activas al pedir. */
  cuenta: CuentaBancaria | null;
  propietario: { id: number; nombre: string; documento: string };
  /** Lo que quedó transferido de verdad (Σ valores activos del pago); null si todavía no hay pago. */
  transferido: string | null;
  /** Transferencia que la atendió. Con `anulado` queda TRANSFERIDA porque el propietario ya tenía otra pendiente. */
  pago: { id: number; numero: number; fecha: string; anulado: boolean } | null;
  /** Última transferencia que la atendió y se anuló. */
  pago_anulado: { id: number; fecha: string | null } | null;
};

/** Fila del listado del panel interno: las pendientes suman el saldo del propietario a hoy. */
export type SolicitudTransferenciaFila = SolicitudTransferencia & { disponible?: string };

/** Respuesta de `GET /propietario/solicitudes-transferencia/nueva`: lo que necesita el modal de pedir. */
export type SolicitudTransferenciaNueva = {
  disponible: string;
  cuentas: CuentaBancaria[];
  pendiente: SolicitudTransferencia | null;
};

/** Transferencia que recibió el propietario, de `GET /propietario/transferencias`. */
export type TransferenciaRecibida = {
  id: number;
  numero: number;
  /** YYYY-MM-DD */
  fecha: string;
  monto_total: string;
  /** Lo que sigue transferido: 0 si la transferencia se anuló. */
  transferido: string;
  estado: "ACTIVO" | "ANULADO";
  /** YYYY-MM-DD; null si no está anulada. */
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
};
