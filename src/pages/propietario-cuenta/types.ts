import type { CuentaCorrienteDetalle } from "../cuentas-corrientes/types";

/** Respuesta de `GET /propietario/cuenta`: la cuenta corriente sin lo del panel interno (liquidar, por documentar y control). */
export type PropietarioCuenta = Omit<CuentaCorrienteDetalle, "liquidar" | "por_documentar" | "control">;
