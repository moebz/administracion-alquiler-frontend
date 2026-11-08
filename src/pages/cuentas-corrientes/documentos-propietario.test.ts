import { describe, expect, it } from "vitest";
import {
  armarLineas,
  armarLineasDelBody,
  editarLinea,
  frasesPorDocumentar,
  hayPorDocumentar,
  quitarLinea,
  totalLineas,
} from "./documentos-propietario";
import type { FacturaPropietarioLineaPrevia, PorDocumentar } from "./types";

const previas: FacturaPropietarioLineaPrevia[] = [
  { cargo_id: 1, tasa_iva: 5, descripcion: "Alquiler Dpto. 2B · 09/26", monto: "3000000.0000" },
  { cargo_id: 2, tasa_iva: 5, descripcion: "Alquiler Dpto. 2B · 10/26", monto: "3000000.0000" },
];

describe("armarLineas", () => {
  it("pasa el monto de string a numero y conserva el cargo y la tasa", () => {
    expect(armarLineas(previas)).toEqual([
      { cargo_id: 1, tasa_iva: 5, descripcion: "Alquiler Dpto. 2B · 09/26", monto: 3000000 },
      { cargo_id: 2, tasa_iva: 5, descripcion: "Alquiler Dpto. 2B · 10/26", monto: 3000000 },
    ]);
  });
});

describe("quitarLinea", () => {
  it("quita solo la linea del cargo indicado", () => {
    expect(quitarLinea(armarLineas(previas), 1).map((linea) => linea.cargo_id)).toEqual([2]);
  });
});

describe("editarLinea", () => {
  it("cambia el monto de la linea del cargo sin tocar las demas", () => {
    const lineas = editarLinea(armarLineas(previas), 2, { monto: 3500000 });

    expect(lineas.map((linea) => linea.monto)).toEqual([3000000, 3500000]);
  });

  it("no cambia la tasa ni el cargo aunque se pase en los cambios", () => {
    const lineas = editarLinea(armarLineas(previas), 1, { descripcion: "Alquiler septiembre" });

    expect(lineas[0]).toMatchObject({ cargo_id: 1, tasa_iva: 5, descripcion: "Alquiler septiembre" });
  });
});

describe("totalLineas", () => {
  it("suma los montos de las lineas", () => {
    expect(totalLineas(armarLineas(previas))).toBe(6000000);
  });

  it("devuelve 0 si no quedan lineas", () => {
    expect(totalLineas([])).toBe(0);
  });
});

describe("armarLineasDelBody", () => {
  it("manda solo el cargo, la descripcion sin espacios de los bordes y el monto", () => {
    const lineas = editarLinea(armarLineas(previas), 1, { descripcion: "  Alquiler septiembre  " });

    expect(armarLineasDelBody(lineas)[0]).toEqual({ cargo_id: 1, descripcion: "Alquiler septiembre", monto: 3000000 });
  });
});

const porDocumentar: PorDocumentar = {
  notas: [{ factura_id: 7, numero: "001-001-0000007", monto: "300000.0000", lineas: [] }],
  facturas: [{ cargo_id: 9, descripcion: "Alquiler Dpto. 2B · 10/26", periodo: "2026-10", monto: "3000000.0000" }],
  total_notas: "300000.0000",
  total_facturas: "3000000.0000",
};

describe("hayPorDocumentar", () => {
  it("es falso si no viene o si no falta nada", () => {
    expect(hayPorDocumentar(undefined)).toBe(false);
    expect(hayPorDocumentar({ notas: [], facturas: [], total_notas: "0", total_facturas: "0" })).toBe(false);
  });

  it("es verdadero si falta una nc o una factura", () => {
    expect(hayPorDocumentar(porDocumentar)).toBe(true);
    expect(hayPorDocumentar({ ...porDocumentar, notas: [] })).toBe(true);
  });
});

describe("frasesPorDocumentar", () => {
  it("arma una frase por nc y por factura, la nc primero", () => {
    const frases = frasesPorDocumentar(porDocumentar);

    expect(frases.map((frase) => frase.clave)).toEqual(["nota-7", "factura-9"]);
    expect(frases[0].texto).toContain("Falta su NC por");
    expect(frases[0].texto).toContain("001-001-0000007");
    expect(frases[1].texto).toContain("Falta su factura por");
    expect(frases[1].texto).toContain("Alquiler Dpto. 2B · 10/26");
  });

  it("habla en tu cuando es para el propietario del portal", () => {
    const frases = frasesPorDocumentar(porDocumentar, "tu");

    expect(frases[0].texto).toContain("Falta tu NC por");
    expect(frases[0].texto).toContain("sobre tu factura 001-001-0000007");
    expect(frases[1].texto).toContain("Falta tu factura por");
    expect(frases[1].texto).toContain("Alquiler Dpto. 2B · 10/26");
  });
});
