import { describe, expect, it } from "vitest";
import { buildFiltrosCargos, FILTROS_CARGOS_INICIALES } from "./filtros";

describe("buildFiltrosCargos", () => {
  it("por defecto filtra pendientes, parciales y vencidos", () => {
    expect(buildFiltrosCargos(FILTROS_CARGOS_INICIALES)).toEqual([
      { field: "estado", operator: "eq", value: "PENDIENTE,PARCIAL,VENCIDO" },
    ]);
  });

  it("sin estados elegidos no manda el filtro de estado", () => {
    expect(buildFiltrosCargos({ estados: [] })).toEqual([]);
  });

  it("manda el rango de periodo como gte y lte sobre el mismo campo", () => {
    expect(buildFiltrosCargos({ estados: [], periodoDesde: "2026-03", periodoHasta: "2026-09" })).toEqual([
      { field: "periodo", operator: "gte", value: "2026-03" },
      { field: "periodo", operator: "lte", value: "2026-09" },
    ]);
  });

  it("arma un filtro por cada campo informado", () => {
    const filters = buildFiltrosCargos({
      inquilinoId: 4,
      edificioId: 2,
      unidadId: 9,
      tipo: "OTRO",
      estados: ["ANULADO"],
    });

    expect(filters).toEqual([
      { field: "inquilino_id", operator: "eq", value: 4 },
      { field: "edificio_id", operator: "eq", value: 2 },
      { field: "unidad_id", operator: "eq", value: 9 },
      { field: "tipo", operator: "eq", value: "OTRO" },
      { field: "estado", operator: "eq", value: "ANULADO" },
    ]);
  });
});
