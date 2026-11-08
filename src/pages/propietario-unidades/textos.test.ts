import { describe, expect, it } from "vitest";
import { formatMonto } from "../../utils/monto";
import { armarTextoDeContrato, armarTextoDePago, armarTextoSinContrato } from "./textos";
import type { AtrasoDeUnidad, ContratoDeUnidad, UnidadDelPortal } from "./types";

const atrasado = (cambios: Partial<AtrasoDeUnidad> = {}): AtrasoDeUnidad => ({
  al_dia: false,
  deuda: "3200000.0000",
  cantidad: 2,
  vencido_desde: "2026-10-05",
  dias: 34,
  ...cambios,
});

const contrato = (cambios: Partial<ContratoDeUnidad> = {}): ContratoDeUnidad => ({
  id: 1,
  inquilino: "Pedro Gómez",
  fecha_inicio: "2026-01-01",
  fecha_fin: "2027-03-31",
  rescision_programada: false,
  monto_alquiler: "3000000.0000",
  ...cambios,
});

const unidadSinContrato = (cambios: Partial<UnidadDelPortal> = {}): UnidadDelPortal => ({
  id: 2,
  etiqueta: "Torre Sol - A - 5A",
  contrato: null,
  contrato_futuro: null,
  atraso: null,
  ...cambios,
});

describe("armarTextoDePago", () => {
  it("dice al dia y no trae detalle si no hay alquileres vencidos", () => {
    // Arrange
    // Crear el atraso de un inquilino sin alquileres vencidos sin pagar.
    const alDia: AtrasoDeUnidad = { al_dia: true, deuda: "0.0000", cantidad: 0, vencido_desde: null, dias: null };

    // Act
    // Armar el texto del pago.
    const texto = armarTextoDePago(alDia);

    // Assert
    // Verificar que dice "Al día" sin detalle, si no mostraría una deuda que no existe.
    expect(texto).toEqual({ etiqueta: "Al día", detalle: null });
  });

  it("dice atrasado con lo que debe de alquiler y los dias desde el vencimiento mas viejo", () => {
    // Arrange
    // Crear el atraso del 2B: debe 3.200.000 y el vencimiento más viejo fue hace 34 días.
    const atraso = atrasado({ deuda: "3200000.0000", dias: 34 });

    // Act
    // Armar el texto del pago.
    const texto = armarTextoDePago(atraso);

    // Assert
    // Verificar que dice "Atrasado" con el monto y los días en plural.
    expect(texto).toEqual({
      etiqueta: "Atrasado",
      detalle: `debe ${formatMonto("3200000")} de alquiler, vencido hace 34 días`,
    });
  });

  it("usa el singular cuando vencio hace un solo dia", () => {
    // Arrange
    // Crear un atraso cuyo vencimiento más viejo fue ayer.
    const atraso = atrasado({ dias: 1 });

    // Act
    // Armar el texto del pago.
    const texto = armarTextoDePago(atraso);

    // Assert
    // Verificar que dice "1 día" y no "1 días".
    expect(texto.detalle).toBe(`debe ${formatMonto("3200000")} de alquiler, vencido hace 1 día`);
  });
});

describe("armarTextoSinContrato", () => {
  it("dice vacia si no tiene contrato futuro", () => {
    // Arrange
    // Crear una unidad sin contrato vigente ni futuro.
    const unidad = unidadSinContrato();

    // Act
    // Armar el texto de la unidad sin contrato.
    const texto = armarTextoSinContrato(unidad);

    // Assert
    // Verificar que dice "Vacía" y no trae inquilino.
    expect(texto).toEqual({ etiqueta: "Vacía", inquilino: null });
  });

  it("dice desde cuando esta alquilada y a quien si ya tiene un contrato futuro", () => {
    // Arrange
    // Crear una unidad sin contrato vigente pero con uno que empieza el 01/12.
    const unidad = unidadSinContrato({ contrato_futuro: { fecha_inicio: "2026-12-01", inquilino: "Ana Díaz" } });

    // Act
    // Armar el texto de la unidad sin contrato.
    const texto = armarTextoSinContrato(unidad);

    // Assert
    // Verificar que dice desde cuándo está alquilada y trae al inquilino que entra.
    expect(texto).toEqual({ etiqueta: "Alquilada desde 01/12/2026", inquilino: "Ana Díaz" });
  });
});

describe("armarTextoDeContrato", () => {
  it("arma el rango de fechas del contrato", () => {
    // Arrange
    // Crear un contrato sin rescisión, del 01/01/2026 al 31/03/2027.
    const vigente = contrato();

    // Act
    // Armar el texto del contrato.
    const texto = armarTextoDeContrato(vigente);

    // Assert
    // Verificar que muestra inicio y fin en formato DD/MM/YYYY.
    expect(texto).toBe("01/01/2026 a 31/03/2027");
  });

  it("dice cuando termina si la rescision esta programada", () => {
    // Arrange
    // Crear un contrato con la rescisión programada: su fecha de fin ya es la de la rescisión.
    const rescindido = contrato({ fecha_fin: "2026-12-31", rescision_programada: true });

    // Act
    // Armar el texto del contrato.
    const texto = armarTextoDeContrato(rescindido);

    // Assert
    // Verificar que dice cuándo termina y que es por rescisión, no el rango original.
    expect(texto).toBe("Termina el 31/12/2026 (rescisión)");
  });
});
