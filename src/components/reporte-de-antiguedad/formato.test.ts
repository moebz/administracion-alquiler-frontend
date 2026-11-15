import { describe, expect, it } from "vitest";
import { formatearMontoEnMoneda } from "./formato";

describe("formatearMontoEnMoneda", () => {
  it("formatea los guaranies como el resto de la app, sin decimales", () => {
    // Arrange
    // Armar la moneda guaraní, que no usa decimales.
    const guarani = { id: 1, codigo: "PYG", decimales: 0 };

    // Act
    // Dar formato a un monto entero.
    const texto = formatearMontoEnMoneda("3000000.0000", guarani);

    // Assert
    // Verificar que lleva el separador de miles y ningún decimal.
    expect(texto).toContain("3.000.000");
    expect(texto).not.toContain(",");
  });

  it("formatea otra moneda con sus decimales y su codigo", () => {
    // Arrange
    // Armar una moneda con 2 decimales.
    const dolar = { id: 2, codigo: "USD", decimales: 2 };

    // Act
    // Dar formato a un monto con centavos.
    const texto = formatearMontoEnMoneda("250.5000", dolar);

    // Assert
    // Verificar que muestra los 2 decimales con coma.
    expect(texto).toContain("250,50");
  });
});
