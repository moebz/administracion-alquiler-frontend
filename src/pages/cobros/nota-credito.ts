import { formatMonto } from "../../utils/monto";
import type { NotaCreditoAplicacionRow } from "./types";

// Describe una aplicación de NC que se anula: dónde se usó el saldo y en cuánto queda abierta su factura.
// `reabierto` es lo que vuelve a deber la factura con todas las aplicaciones que se anulan juntas.
export const describirAplicacion = (
  aplicacion: NotaCreditoAplicacionRow,
  reabierto: number
) => {
  const monto = formatMonto(aplicacion.monto_aplicado);
  const abierta = formatMonto(Number(aplicacion.saldo_factura) + reabierto);

  // Si se usó en un cobro, el texto nombra el cobro.
  if (aplicacion.numero_cobro !== null) {
    return `Se usó ${monto} en el cobro ${aplicacion.numero_cobro}: la factura ${aplicacion.numero_factura} queda abierta por ${abierta}.`;
  }

  // Si se aplicó sola al emitir la NC, el texto nombra la factura.
  return `Se aplicó ${monto} a la cuota de la factura ${aplicacion.numero_factura}: queda abierta por ${abierta}.`;
};

// Lista las aplicaciones activas de una NC con su efecto sobre la factura, una línea por aplicación.
export const describirAplicacionesActivas = (
  aplicaciones: NotaCreditoAplicacionRow[]
) => {
  const activas = aplicaciones.filter(
    (aplicacion) => aplicacion.estado === "ACTIVA"
  );

  // Sumar por factura lo que se reabre, porque varias aplicaciones pueden ir a la misma.
  const reabiertoPorFactura = new Map<number, number>();
  for (const aplicacion of activas) {
    reabiertoPorFactura.set(
      aplicacion.documento_venta_id,
      (reabiertoPorFactura.get(aplicacion.documento_venta_id) ?? 0) +
        Number(aplicacion.monto_aplicado)
    );
  }

  return activas.map((aplicacion) =>
    describirAplicacion(
      aplicacion,
      reabiertoPorFactura.get(aplicacion.documento_venta_id) ?? 0
    )
  );
};

// Calcula cómo se aplica una NC nueva: hasta el saldo de la factura va a su cuota y el resto queda a favor del inquilino.
export const repartirNotaCredito = (total: number, saldoFactura: number) => {
  const aplicado = Math.min(total, Math.max(saldoFactura, 0));

  return { aplicado, aFavor: total - aplicado };
};
