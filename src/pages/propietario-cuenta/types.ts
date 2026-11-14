import type { CuentaCorrienteDetalle } from "../cuentas-corrientes/types";

/** Respuesta de `GET /propietario/cuenta`: la cuenta corriente sin lo del panel interno (rendir, por documentar y control). */
export type PropietarioCuenta = Omit<CuentaCorrienteDetalle, "rendir" | "por_documentar" | "control">;
