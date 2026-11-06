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

// Nombre en lenguaje humano de los permisos que puede pedir una corrección, para avisar el que le falta al usuario.
const PERMISO_LABEL: Record<string, string> = {
  "cargos.corregir_monto": "corregir el monto de los cargos",
  "cargos.corregir_mora": "corregir el monto de las moras",
  "facturas.emitir_nc": "emitir notas de crédito",
};

// Arma el aviso de los permisos que le faltan al usuario para una corrección.
export const describirPermisosFaltantes = (permisos: string[]): string =>
  `Te falta permiso para ${permisos.map((permiso) => PERMISO_LABEL[permiso] ?? permiso).join(" y para ")}.`;
