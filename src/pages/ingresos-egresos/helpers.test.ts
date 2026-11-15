import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  armarFilasDeResumen,
  armarTextoDeAnulado,
  armarTextoDeQueSeAnulo,
  formatearFecha,
  formatearParaApi,
  nombreDelPdfDeIngresosEgresos,
  obtenerPeriodoPorDefecto,
  obtenerSignoDeCategoria,
  rutaDelPdfDeIngresosEgresos,
} from "./helpers";
import type { MonedaDelReporte, MovimientoDelReporte } from "./types";

const movimiento = (datos: Partial<MovimientoDelReporte>): MovimientoDelReporte => ({
  movimiento_id: 1,
  fecha: "2026-11-05",
  monto: "-3000000.0000",
  fondo: { id: 1, nombre: "Caja" },
  medio_pago: null,
  persona: null,
  origen: "COBRO",
  numero: 12,
  concepto: null,
  anulado_el: null,
  cobro_cliente_id: 12,
  pago_proveedor_id: null,
  fecha_movimiento: "2026-10-03",
  ...datos,
});

describe("obtenerPeriodoPorDefecto", () => {
  it("va del 1 del mes actual a hoy", () => {
    const [desde, hasta] = obtenerPeriodoPorDefecto(dayjs("2026-10-20T15:30:00"));

    expect(formatearParaApi(desde)).toBe("2026-10-01");
    expect(formatearParaApi(hasta)).toBe("2026-10-20");
  });

  it("el primer dia del mes da un periodo de un solo dia", () => {
    const [desde, hasta] = obtenerPeriodoPorDefecto(dayjs("2026-11-01"));

    expect(formatearParaApi(desde)).toBe("2026-11-01");
    expect(formatearParaApi(hasta)).toBe("2026-11-01");
  });
});

describe("nombreDelPdfDeIngresosEgresos", () => {
  it("arma el nombre con desde y hasta, como el backend", () => {
    expect(nombreDelPdfDeIngresosEgresos("2026-10-01", "2026-10-31")).toBe("ingresos-egresos-2026-10-01-a-2026-10-31.pdf");
  });
});

describe("rutaDelPdfDeIngresosEgresos", () => {
  it("manda el periodo elegido", () => {
    expect(rutaDelPdfDeIngresosEgresos("2026-10-01", "2026-10-31")).toBe(
      "reportes/ingresos-egresos/pdf?desde=2026-10-01&hasta=2026-10-31",
    );
  });
});

describe("formatearFecha", () => {
  it("muestra la fecha como DD/MM/YYYY", () => {
    expect(formatearFecha("2026-10-03")).toBe("03/10/2026");
  });
});

describe("armarTextoDeQueSeAnulo", () => {
  it("nombra el cobro con su numero y su fecha", () => {
    expect(armarTextoDeQueSeAnulo(movimiento({}))).toBe("Cobro N° 12 del 03/10/2026");
  });

  it("nombra el pago con su numero y su fecha", () => {
    expect(armarTextoDeQueSeAnulo(movimiento({ origen: "PAGO", numero: 7 }))).toBe("Pago N° 7 del 03/10/2026");
  });

  it("nombra un movimiento de otro origen por su concepto", () => {
    expect(armarTextoDeQueSeAnulo(movimiento({ origen: "OTRO", numero: null, concepto: "Ajuste de caja" }))).toBe(
      "Ajuste de caja del 03/10/2026",
    );
  });

  it("usa la fecha del movimiento si no viene la del original", () => {
    expect(armarTextoDeQueSeAnulo(movimiento({ fecha_movimiento: undefined, fecha: "2026-11-05" }))).toBe("Cobro N° 12 del 05/11/2026");
  });
});

describe("armarTextoDeAnulado", () => {
  it("arma el texto del tag con la fecha de la anulacion", () => {
    expect(armarTextoDeAnulado("2026-11-05")).toBe("Anulado el 05/11/2026");
  });
});

describe("obtenerSignoDeCategoria", () => {
  it("los cobros suman, los pagos y las transferencias restan, y el resto depende del movimiento", () => {
    expect(obtenerSignoDeCategoria("COBROS")).toBe("+");
    expect(obtenerSignoDeCategoria("PAGOS_PROVEEDORES")).toBe("−");
    expect(obtenerSignoDeCategoria("TRANSFERENCIAS_PROPIETARIOS")).toBe("−");
    expect(obtenerSignoDeCategoria("ANULACIONES")).toBe("±");
    expect(obtenerSignoDeCategoria("OTROS")).toBe("±");
  });
});

describe("armarFilasDeResumen", () => {
  const bloque: MonedaDelReporte = {
    moneda: { id: 1, codigo: "PYG", decimales: 0 },
    saldo_inicial: "1000000.0000",
    categorias: [
      { clave: "COBROS", nombre: "Cobros a inquilinos", total: "3000000.0000", movimientos: [] },
      { clave: "PAGOS_PROVEEDORES", nombre: "Pagos a proveedores", total: "-500000.0000", movimientos: [] },
    ],
    neto: "2500000.0000",
    saldo_final: "3500000.0000",
  };

  it("arma el saldo inicial, una fila por categoria, el neto y el saldo final, en ese orden", () => {
    const filas = armarFilasDeResumen(bloque, "2026-11-01", "2026-11-30");

    expect(filas.map((fila) => fila.tipo)).toEqual(["SALDO_INICIAL", "CATEGORIA", "CATEGORIA", "NETO", "SALDO_FINAL"]);
    expect(filas.map((fila) => fila.monto)).toEqual(["1000000.0000", "3000000.0000", "-500000.0000", "2500000.0000", "3500000.0000"]);
  });

  it("rotula el saldo inicial con el dia anterior a desde y el final con hasta", () => {
    const filas = armarFilasDeResumen(bloque, "2026-11-01", "2026-11-30");

    expect(filas[0].etiqueta).toBe("Saldo al 31/10/2026 según lo cargado hoy");
    expect(filas[4].etiqueta).toBe("Saldo al 30/11/2026 según lo cargado hoy");
  });

  it("antepone el signo al nombre de cada categoria y la deja para desplegarla", () => {
    const filas = armarFilasDeResumen(bloque, "2026-11-01", "2026-11-30");

    expect(filas[1].etiqueta).toBe("+ Cobros a inquilinos");
    expect(filas[2].etiqueta).toBe("− Pagos a proveedores");
    expect(filas[1].categoria).toBe(bloque.categorias[0]);
    expect(filas[0].categoria).toBeUndefined();
  });
});
