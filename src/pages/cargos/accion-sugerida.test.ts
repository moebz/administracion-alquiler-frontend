import { describe, expect, it } from "vitest";
import { formatMonto } from "../../utils/monto";
import { accionSugeridaTexto, type AccionSugerida } from "./types";

const accion = (cambios: Partial<AccionSugerida>): AccionSugerida => ({
  codigo: "AJUSTAR_Y_REAPUNTAR",
  facturado: "600000.0000",
  monto_vigente: "600000.0000",
  linea: { id: 73, descripcion: "M.O. instalación", subtotal: "650000.0000" },
  diferencia: "50000.0000",
  candidatas: [],
  ...cambios,
});

describe("accionSugeridaTexto", () => {
  it("dice que la diferencia queda como ajuste a cobrar si la linea nueva supera el monto vigente", () => {
    // Act
    // Armar el texto de una línea de 650.000 sobre un monto vigente de 600.000.
    const texto = accionSugeridaTexto(accion({}), "INQUILINO", 10);

    // Assert
    // Verificar que menciona la diferencia como ajuste a cobrar.
    expect(texto).toBe(`Reapuntalo a la línea nueva; la diferencia (${formatMonto(50000)}) queda como ajuste a cobrar.`);
  });

  it("solo pide reapuntar si la linea nueva coincide con el monto vigente", () => {
    // Act
    // Armar el texto de una línea igual al monto vigente, sin diferencia.
    const texto = accionSugeridaTexto(
      accion({ linea: { id: 73, descripcion: "M.O. instalación", subtotal: "600000.0000" }, diferencia: "0.0000" }),
      "INQUILINO",
      10,
    );

    // Assert
    // Verificar que no habla de ajuste.
    expect(texto).toBe('Reapuntá el cargo a la línea nueva "M.O. instalación".');
  });

  it("pide corregir el monto al de la linea si es menor que el monto vigente", () => {
    // Act
    // Armar el texto de una línea de 550.000 sobre un monto vigente de 600.000.
    const texto = accionSugeridaTexto(
      accion({ codigo: "NC_Y_REAPUNTAR", linea: { id: 73, descripcion: "M.O. instalación", subtotal: "550000.0000" }, diferencia: "50000.0000" }),
      "INQUILINO",
      10,
    );

    // Assert
    // Verificar que indica el monto al que hay que corregir.
    expect(texto).toBe(`Corregí el monto a ${formatMonto(550000)} y reapuntá.`);
  });
});
