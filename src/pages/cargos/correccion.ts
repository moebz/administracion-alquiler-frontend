import type { CargoRow, CargoTipo, PasoCorreccion } from "./types";

// Permiso que pide corregir el monto de un cargo: la mora tiene el suyo (bajarla es perdonarla).
export const permisoParaCorregir = (tipo: CargoTipo): string =>
  tipo === "MORA" ? "cargos.corregir_mora" : "cargos.corregir_monto";

// Dice si se ofrece "Corregir monto": no en un AJUSTE (se corrige su original) ni en un cargo anulado.
export const puedeCorregirMonto = (
  cargo: Pick<CargoRow, "tipo" | "estado">,
  permisos: string[] | undefined,
): boolean => {
  if (cargo.tipo === "AJUSTE" || cargo.estado === "ANULADO") {
    return false;
  }
  return permisos?.includes(permisoParaCorregir(cargo.tipo)) ?? false;
};

// Dice si algún paso del plan emite una NC (y entonces pide `facturas.emitir_nc`).
export const emiteNotasCredito = (pasos: PasoCorreccion[]): boolean => pasos.some((paso) => paso.tipo === "NC");
