import { describe, expect, it } from "vitest";
import {
  describirAplicacionesActivas,
  repartirNotaCredito,
} from "./nota-credito";
import type { NotaCreditoAplicacionRow } from "./types";

const aplicacion = (
  datos: Partial<NotaCreditoAplicacionRow>
): NotaCreditoAplicacionRow => ({
  id: 1,
  cuota_id: 10,
  documento_venta_id: 100,
  numero_factura: "001-002-0000102",
  saldo_factura: 0,
  cobro_cliente_id: null,
  numero_cobro: null,
  monto_aplicado: 50000,
  estado: "ACTIVA",
  fecha_anulacion: null,
  motivo_anulacion: null,
  ...datos,
});

describe("repartirNotaCredito", () => {
  it("aplica todo a la cuota si la factura debe mas que la nc", () => {
    // Arrange
    // Una NC de 300.000 sobre una factura abierta por 3.000.000.
    // Act
    const reparto = repartirNotaCredito(300000, 3000000);

    // Assert
    // Verificar que todo va a la cuota y no queda saldo a favor.
    expect(reparto).toEqual({ aplicado: 300000, aFavor: 0 });
  });

  it("deja todo a favor si la factura esta pagada", () => {
    // Arrange
    // Una NC de 50.000 sobre una factura saldada.
    // Act
    const reparto = repartirNotaCredito(50000, 0);

    // Assert
    // Verificar que nada se aplica y los 50.000 quedan a favor del inquilino.
    expect(reparto).toEqual({ aplicado: 0, aFavor: 50000 });
  });

  it("reparte entre la cuota y el saldo a favor si la factura debe menos que la nc", () => {
    // Arrange
    // Una NC de 300.000 sobre una factura que debe 50.000.
    // Act
    const reparto = repartirNotaCredito(300000, 50000);

    // Assert
    // Verificar que 50.000 saldan la cuota y 250.000 quedan a favor.
    expect(reparto).toEqual({ aplicado: 50000, aFavor: 250000 });
  });
});

describe("describirAplicacionesActivas", () => {
  it("nombra el cobro y la factura que queda abierta si se uso en un cobro", () => {
    // Arrange
    // Una aplicación de 50.000 usada en el cobro 201, con la factura 102 saldada.
    const aplicaciones = [aplicacion({ numero_cobro: 201, cobro_cliente_id: 5 })];

    // Act
    const textos = describirAplicacionesActivas(aplicaciones);

    // Assert
    // Verificar que el texto dice dónde se usó y que la factura queda abierta por lo aplicado.
    expect(textos).toHaveLength(1);
    expect(textos[0]).toContain("en el cobro 201");
    expect(textos[0]).toContain("la factura 001-002-0000102 queda abierta por");
  });

  it("nombra la cuota de la factura si se aplico sola al emitir la nc", () => {
    // Arrange
    // Una aplicación sin cobro, con la factura debiendo 2.700.000 por ella.
    const aplicaciones = [aplicacion({ monto_aplicado: 300000, saldo_factura: 2700000 })];

    // Act
    const textos = describirAplicacionesActivas(aplicaciones);

    // Assert
    // Verificar que el texto habla de la cuota y suma lo aplicado al saldo de la factura (3.000.000).
    expect(textos[0]).toContain("a la cuota de la factura 001-002-0000102");
    expect(textos[0]).toContain("3.000.000");
  });

  it("suma lo reabierto cuando varias aplicaciones van a la misma factura", () => {
    // Arrange
    // Dos aplicaciones activas (50.000 y 30.000) a la misma factura, saldada.
    const aplicaciones = [
      aplicacion({ id: 1, monto_aplicado: 50000 }),
      aplicacion({ id: 2, monto_aplicado: 30000 }),
    ];

    // Act
    const textos = describirAplicacionesActivas(aplicaciones);

    // Assert
    // Verificar que las dos líneas dicen que la factura queda abierta por el total (80.000), no por cada una.
    expect(textos).toHaveLength(2);
    expect(textos.every((texto) => texto.includes("80.000"))).toBe(true);
  });

  it("ignora las aplicaciones anuladas", () => {
    // Arrange
    // Una aplicación activa y otra anulada.
    const aplicaciones = [
      aplicacion({ id: 1 }),
      aplicacion({ id: 2, estado: "ANULADA" }),
    ];

    // Act
    const textos = describirAplicacionesActivas(aplicaciones);

    // Assert
    // Verificar que solo se lista la activa: la anulada ya no reabre nada.
    expect(textos).toHaveLength(1);
  });
});
