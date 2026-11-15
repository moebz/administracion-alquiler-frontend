import { describe, expect, it } from "vitest";
import {
  armarTextoDelPeriodo,
  armarTextoDeContratosMorosos,
  armarTextoDeMontos,
  armarTextoDeSolicitudes,
  armarTextoDeTerminados,
  armarTextoDeUnidades,
  armarTextoSinContratosPorTerminar,
  armarValorDeMorosidad,
  armarValorDeOcupacion,
  formatearPorcentajeOTextoVacio,
  hayIndicadores,
} from "./helpers";
import type { MontoPorMoneda, Morosidad, Ocupacion } from "./types";

const pyg = { id: 1, codigo: "PYG", decimales: 0 };
const usd = { id: 2, codigo: "USD", decimales: 2 };

const morosidad = (datos: Partial<Morosidad>): Morosidad => ({
  contratos_vigentes: 2,
  contratos_morosos: 1,
  porcentaje: 50,
  monto_vencido: [{ moneda: pyg, monto: "1000000.0000" }],
  terminados: { contratos: 0, monto_vencido: [{ moneda: pyg, monto: "0.0000" }] },
  ...datos,
});

const ocupacion = (datos: Partial<Ocupacion>): Ocupacion => ({ unidades: 3, alquiladas: 1, porcentaje: 33.3, ...datos });

describe("hayIndicadores", () => {
  it("es falso si la respuesta viene vacia", () => {
    expect(hayIndicadores({})).toBe(false);
  });

  it("es verdadero si viene al menos un indicador", () => {
    expect(hayIndicadores({ ocupacion: ocupacion({}) })).toBe(true);
  });
});

describe("formatearPorcentajeOTextoVacio", () => {
  it("da formato al porcentaje con coma decimal", () => {
    expect(formatearPorcentajeOTextoVacio(33.3, "Sin datos")).toBe("33,3%");
  });

  it("devuelve el texto vacio si no hay porcentaje", () => {
    expect(formatearPorcentajeOTextoVacio(null, "Sin datos")).toBe("Sin datos");
  });

  it("muestra 0% y no el texto vacio cuando el porcentaje es cero", () => {
    expect(formatearPorcentajeOTextoVacio(0, "Sin datos")).toBe("0%");
  });
});

describe("armarValorDeMorosidad y armarValorDeOcupacion", () => {
  it("dicen que no hay contratos vigentes en vez de un porcentaje", () => {
    expect(armarValorDeMorosidad(morosidad({ contratos_vigentes: 0, porcentaje: null }))).toBe("Sin contratos vigentes");
  });

  it("dicen que no hay unidades en vez de un porcentaje", () => {
    expect(armarValorDeOcupacion(ocupacion({ unidades: 0, alquiladas: 0, porcentaje: null }))).toBe("Sin unidades");
  });
});

describe("armarTextoDeContratosMorosos", () => {
  it("cuenta los morosos sobre los vigentes", () => {
    expect(armarTextoDeContratosMorosos(morosidad({}))).toBe("1 de 2 contratos vigentes con deuda vencida");
  });

  it("usa el singular con un solo contrato vigente", () => {
    expect(armarTextoDeContratosMorosos(morosidad({ contratos_vigentes: 1, contratos_morosos: 0 }))).toBe(
      "0 de 1 contrato vigente con deuda vencida",
    );
  });

  it("devuelve null sin contratos vigentes", () => {
    expect(armarTextoDeContratosMorosos(morosidad({ contratos_vigentes: 0, contratos_morosos: 0, porcentaje: null }))).toBeNull();
  });
});

describe("armarTextoDeTerminados", () => {
  it("devuelve null si ningun contrato terminado debe algo vencido", () => {
    expect(armarTextoDeTerminados({ contratos: 0, monto_vencido: [{ moneda: pyg, monto: "0.0000" }] })).toBeNull();
  });

  it("nombra la cantidad de contratos y el monto vencido", () => {
    const texto = armarTextoDeTerminados({ contratos: 2, monto_vencido: [{ moneda: pyg, monto: "700000.0000" }] });

    expect(texto).toContain("2 contratos terminados con deuda vencida: ");
    expect(texto).toContain("700.000");
  });
});

describe("armarTextoDeUnidades", () => {
  it("cuenta las alquiladas sobre las unidades activas", () => {
    expect(armarTextoDeUnidades(ocupacion({}))).toBe("1 de 3 unidades alquiladas");
  });

  it("devuelve null sin unidades activas", () => {
    expect(armarTextoDeUnidades(ocupacion({ unidades: 0, alquiladas: 0, porcentaje: null }))).toBeNull();
  });
});

describe("armarTextoDeMontos", () => {
  it("muestra los guaranies en cero si no hay otra moneda", () => {
    const montos: MontoPorMoneda[] = [{ moneda: pyg, monto: "0.0000" }];

    expect(armarTextoDeMontos(montos)).toContain("0");
  });

  it("omite la moneda en cero cuando otra tiene monto", () => {
    const montos: MontoPorMoneda[] = [
      { moneda: pyg, monto: "0.0000" },
      { moneda: usd, monto: "150.0000" },
    ];

    const texto = armarTextoDeMontos(montos);

    expect(texto).toContain("150");
    expect(texto).not.toContain("·");
  });

  it("une con un punto medio los montos de monedas distintas", () => {
    const montos: MontoPorMoneda[] = [
      { moneda: pyg, monto: "1000.0000" },
      { moneda: usd, monto: "150.0000" },
    ];

    expect(armarTextoDeMontos(montos)).toContain(" · ");
  });
});

describe("armarTextoDeSolicitudes", () => {
  it("avisa que no hay ninguna pendiente", () => {
    expect(armarTextoDeSolicitudes(0)).toBe("Ninguna solicitud pendiente");
  });

  it("usa el singular con una", () => {
    expect(armarTextoDeSolicitudes(1)).toBe("1 solicitud pendiente");
  });

  it("usa el plural con varias", () => {
    expect(armarTextoDeSolicitudes(3)).toBe("3 solicitudes pendientes");
  });
});

describe("armarTextoSinContratosPorTerminar", () => {
  it("nombra el plazo", () => {
    expect(armarTextoSinContratosPorTerminar(60)).toBe("Ningún contrato termina en los próximos 60 días");
  });
});

describe("armarTextoDelPeriodo", () => {
  it("da formato DD/MM/YYYY a las dos fechas", () => {
    expect(armarTextoDelPeriodo("2026-10-01", "2026-10-31")).toBe("Del 01/10/2026 al 31/10/2026");
  });
});
