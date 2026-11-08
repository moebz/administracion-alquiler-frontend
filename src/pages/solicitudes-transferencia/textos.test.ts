import { describe, expect, it } from "vitest";
import { formatMonto } from "../../utils/monto";
import {
  armarAvisoDeAtencion,
  armarAvisoDePedido,
  armarTextosDeSolicitud,
  elegirCuentaPrecargada,
  elegirMontoPrecargado,
} from "./textos";
import type { SolicitudTransferencia } from "./types";

// Sin zona horaria en la fecha para que dayjs la lea como hora local y el test no dependa de dónde corre.
const solicitud = (cambios: Partial<SolicitudTransferencia> = {}): SolicitudTransferencia => ({
  id: 1,
  fecha: "2026-11-08T10:30:00",
  monto: "5250000.0000",
  estado: "PENDIENTE",
  motivo_rechazo: null,
  fecha_resolucion: null,
  cuenta: { id: 7, banco: "Itaú", numero_cuenta: "123" },
  propietario: { id: 3, nombre: "Juan Pérez", documento: "1234567" },
  transferido: null,
  pago: null,
  pago_anulado: null,
  ...cambios,
});

describe("armarTextosDeSolicitud", () => {
  it("avisa que la administradora esta atendiendo la solicitud pendiente", () => {
    expect(armarTextosDeSolicitud(solicitud())).toEqual([
      `Pediste ${formatMonto("5250000.0000")} el 08/11/2026 10:30. La administradora la está atendiendo.`,
    ]);
  });

  it("suma que la transferencia anterior se anulo si la pendiente fue reabierta", () => {
    const frases = armarTextosDeSolicitud(solicitud({ pago_anulado: { id: 9, fecha: "2026-11-09" } }));

    expect(frases).toHaveLength(2);
    expect(frases[1]).toBe("La transferencia del 09/11/2026 se anuló.");
  });

  it("muestra lo pedido y lo transferido cuando esta transferida", () => {
    const transferida = solicitud({
      estado: "TRANSFERIDA",
      transferido: "4800000.0000",
      pago: { id: 9, numero: 4, fecha: "2026-11-08", anulado: false },
    });

    expect(armarTextosDeSolicitud(transferida)).toEqual([
      `Pediste ${formatMonto("5250000.0000")} · Te transferimos ${formatMonto("4800000.0000")} el 08/11/2026.`,
    ]);
  });

  it("marca como anulada la transferencia si la solicitud quedo transferida con su pago anulado", () => {
    const transferida = solicitud({
      estado: "TRANSFERIDA",
      transferido: "0.0000",
      pago: { id: 9, numero: 4, fecha: "2026-11-08", anulado: true },
    });

    expect(armarTextosDeSolicitud(transferida)[0]).toMatch(/ el 08\/11\/2026 \(anulada\)\.$/);
  });

  it("muestra el motivo cuando esta rechazada", () => {
    expect(armarTextosDeSolicitud(solicitud({ estado: "RECHAZADA", motivo_rechazo: "Cuenta equivocada" }))).toEqual([
      "Rechazada: Cuenta equivocada",
    ]);
  });

  it("dice que cancelo la solicitud cuando esta cancelada", () => {
    expect(armarTextosDeSolicitud(solicitud({ estado: "CANCELADA" }))).toEqual([
      "Cancelaste tu solicitud del 08/11/2026 10:30.",
    ]);
  });
});

describe("armarAvisoDeAtencion", () => {
  it("nombra al propietario, el monto pedido y la fecha del pedido", () => {
    expect(armarAvisoDeAtencion(solicitud())).toBe(
      `Atiende la solicitud de Juan Pérez por ${formatMonto("5250000.0000")} del 08/11/2026 10:30.`,
    );
  });
});

describe("armarAvisoDePedido", () => {
  it("dice quien pidio, cuanto y cuando", () => {
    expect(armarAvisoDePedido(solicitud())).toBe(`Juan Pérez pidió ${formatMonto("5250000.0000")} el 08/11/2026 10:30.`);
  });
});

describe("elegirMontoPrecargado", () => {
  it("propone el monto de la solicitud en vez del sugerido", () => {
    const previa = { sugerido: "2850000.0000", tope: "5250000.0000", solicitud: solicitud({ monto: "4000000.0000" }) };

    expect(elegirMontoPrecargado(previa)).toBe(4000000);
  });

  it("recorta el monto de la solicitud al tope si el saldo bajo desde que la pidio", () => {
    const previa = { sugerido: "0.0000", tope: "3000000.0000", solicitud: solicitud() };

    expect(elegirMontoPrecargado(previa)).toBe(3000000);
  });

  it("no propone nada si el saldo a esa fecha es cero, aunque haya solicitud", () => {
    const previa = { sugerido: "0.0000", tope: "0.0000", solicitud: solicitud() };

    expect(elegirMontoPrecargado(previa)).toBeUndefined();
  });

  it("propone el sugerido si no hay solicitud", () => {
    expect(elegirMontoPrecargado({ sugerido: "2850000.0000", tope: "5250000.0000", solicitud: null })).toBe(2850000);
  });

  it("no propone nada si no hay solicitud ni sugerido", () => {
    expect(elegirMontoPrecargado({ sugerido: "0.0000", tope: "5250000.0000", solicitud: null })).toBeUndefined();
  });
});

describe("elegirCuentaPrecargada", () => {
  it("propone la cuenta de la solicitud si sigue activa", () => {
    expect(elegirCuentaPrecargada({ cuentas: [{ id: 5 }, { id: 7 }], solicitud: solicitud() })).toBe(7);
  });

  it("no propone la cuenta si ya no esta entre las activas del propietario", () => {
    expect(elegirCuentaPrecargada({ cuentas: [{ id: 5 }], solicitud: solicitud() })).toBeUndefined();
  });

  it("no propone nada si la solicitud no tiene cuenta o no hay solicitud", () => {
    expect(elegirCuentaPrecargada({ cuentas: [{ id: 5 }], solicitud: solicitud({ cuenta: null }) })).toBeUndefined();
    expect(elegirCuentaPrecargada({ cuentas: [{ id: 5 }], solicitud: null })).toBeUndefined();
  });
});
