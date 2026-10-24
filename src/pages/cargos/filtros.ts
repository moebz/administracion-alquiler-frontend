import type { CrudFilter } from "@refinedev/core";
import { CARGO_ESTADOS_PENDIENTES, type CargoDeudor, type CargoEstado, type CargoTipo } from "./types";

export type FiltrosCargos = {
  cargoId?: number;
  contratoId?: number;
  gastoId?: number;
  deudor?: CargoDeudor;
  personaId?: number;
  edificioId?: number;
  unidadId?: number;
  tipo?: CargoTipo;
  estados: CargoEstado[];
  // "YYYY-MM"
  periodoDesde?: string;
  periodoHasta?: string;
};

export const FILTROS_CARGOS_INICIALES: FiltrosCargos = { estados: CARGO_ESTADOS_PENDIENTES };

export const buildFiltrosCargos = (filtros: FiltrosCargos): CrudFilter[] => {
  const filters: CrudFilter[] = [];

  if (filtros.cargoId) {
    filters.push({ field: "cargo_id", operator: "eq", value: filtros.cargoId });
  }
  if (filtros.contratoId) {
    filters.push({ field: "contrato_id", operator: "eq", value: filtros.contratoId });
  }
  if (filtros.gastoId) {
    filters.push({ field: "gasto_id", operator: "eq", value: filtros.gastoId });
  }
  if (filtros.deudor) {
    filters.push({ field: "deudor", operator: "eq", value: filtros.deudor });
  }
  if (filtros.personaId) {
    filters.push({ field: "persona_id", operator: "eq", value: filtros.personaId });
  }
  if (filtros.edificioId) {
    filters.push({ field: "edificio_id", operator: "eq", value: filtros.edificioId });
  }
  if (filtros.unidadId) {
    filters.push({ field: "unidad_id", operator: "eq", value: filtros.unidadId });
  }
  if (filtros.tipo) {
    filters.push({ field: "tipo", operator: "eq", value: filtros.tipo });
  }
  if (filtros.estados.length > 0) {
    filters.push({ field: "estado", operator: "eq", value: filtros.estados.join(",") });
  }
  if (filtros.periodoDesde) {
    filters.push({ field: "periodo", operator: "gte", value: filtros.periodoDesde });
  }
  if (filtros.periodoHasta) {
    filters.push({ field: "periodo", operator: "lte", value: filtros.periodoHasta });
  }

  return filters;
};
