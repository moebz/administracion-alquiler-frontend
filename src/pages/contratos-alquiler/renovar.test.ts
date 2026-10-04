import { describe, expect, it } from "vitest";
import { valoresRenovacion } from "./renovar";
import type { ContratoAlquilerRow } from "./types";

const contrato = {
  id: 7,
  unidad_id: 3,
  inquilino_id: 9,
  fecha_inicio: "2025-01-01",
  fecha_fin: "2025-12-31",
  fecha_fin_efectiva: "2025-12-31",
  monto_alquiler_vigente: "3000000.0000",
  comision_pct: "10.0000",
  mora_pct_diario: "0.1000",
  mora_tope_pct: null,
  dia_vencimiento: 5,
  dias_gracia: 2,
  expensas_a_cargo_de: "INQUILINO",
} as unknown as ContratoAlquilerRow;

describe("valoresRenovacion", () => {
  it("arranca el dia siguiente al fin del contrato anterior", () => {
    expect(valoresRenovacion(contrato).fecha_inicio).toBe("2026-01-01");
  });

  it("usa el fin efectivo si el contrato fue rescindido", () => {
    expect(valoresRenovacion({ ...contrato, fecha_fin_efectiva: "2025-06-30" }).fecha_inicio).toBe("2025-07-01");
  });

  it("precarga unidad, inquilino y condiciones, con los montos como numeros", () => {
    expect(valoresRenovacion(contrato)).toMatchObject({
      unidad_id: 3,
      inquilino_id: 9,
      monto_alquiler: 3000000,
      comision_pct: 10,
      mora_pct_diario: 0.1,
      dia_vencimiento: 5,
      dias_gracia: 2,
      expensas_a_cargo_de: "INQUILINO",
    });
  });

  it("deja sin valor el tope de mora y el monto si el contrato no los tiene", () => {
    const valores = valoresRenovacion({ ...contrato, monto_alquiler_vigente: null });
    expect(valores.mora_tope_pct).toBeUndefined();
    expect(valores.monto_alquiler).toBeUndefined();
  });

  it("no pisa la fecha de fin: la elige quien renueva", () => {
    expect(valoresRenovacion(contrato)).not.toHaveProperty("fecha_fin");
  });
});
