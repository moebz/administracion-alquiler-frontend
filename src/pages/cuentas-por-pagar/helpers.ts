import { formatearMontoEnMoneda, type Moneda } from "../../components/reporte-de-antiguedad";
import type { CuentasPorPagarDeuda, FiltrosCuentasPorPagar, PermisosDeEnlaces } from "./types";

/** Arma el nombre del PDF; es el mismo que arma `nombreDeArchivo()` del backend. `hoy` es YYYY-MM-DD. */
export const nombreDelPdfDeCuentasPorPagar = (hoy: string): string => `cuentas-por-pagar-${hoy}.pdf`;

/** Arma la ruta del PDF con los filtros activos; sin filtros pide el reporte entero. */
export const rutaDelPdfDeCuentasPorPagar = ({ edificioId, unidadId }: FiltrosCuentasPorPagar): string => {
  const params = new URLSearchParams();

  if (edificioId) {
    params.set("edificio_id", String(edificioId));
  }

  if (unidadId) {
    params.set("unidad_id", String(unidadId));
  }

  const query = params.toString();
  return query ? `reportes/cuentas-por-pagar/pdf?${query}` : "reportes/cuentas-por-pagar/pdf";
};

/**
 * Arma el texto de la columna "Documento" según la fila: el número del papel (factura, ND, NC), "Pago N° …" en el
 * anticipo, "Transferencia (pago N° …)" en la transferencia y, en el alquiler del propietario, sus facturas o
 * "Falta su factura"; si está facturado en parte, los números y " · resto sin facturar".
 */
export const armarTextoDeDocumento = ({ tipo, documentos }: Pick<CuentasPorPagarDeuda, "tipo" | "documentos">): string => {
  const numeros = documentos.numeros.join(", ");

  if (tipo === "TRANSFERENCIA") {
    return `Transferencia (pago N° ${numeros})`;
  }

  if (tipo === "ALQUILER" && numeros === "") {
    return "Falta su factura";
  }

  const nombres = { FACTURA: "Factura", NOTA_DEBITO: "ND", NOTA_CREDITO: "NC", PAGO: "Pago N°" };
  const texto = `${nombres[documentos.tipo]} ${numeros}`;

  if (documentos.sin_facturar) {
    return `${texto} · resto sin facturar`;
  }

  return texto;
};

/**
 * Arma el link del documento de una deuda: la cuota y la NC del proveedor llevan al gasto (ahí está "Registrar pago"),
 * el anticipo y la transferencia llevan al pago. Devuelve null si la fila no tiene a dónde llevar o si el usuario no
 * puede ver esa pantalla, y entonces el documento es texto plano.
 */
export const armarEnlaceDelDocumento = (
  { gasto_id, pago_proveedor_id }: Pick<CuentasPorPagarDeuda, "gasto_id" | "pago_proveedor_id">,
  { puedeVerGastos, puedeVerPagos }: PermisosDeEnlaces,
): string | null => {
  if (gasto_id !== null && puedeVerGastos) {
    return `/administrador/gastos/show/${gasto_id}`;
  }

  if (pago_proveedor_id !== null && puedeVerPagos) {
    return `/administrador/pagos-proveedor/show/${pago_proveedor_id}`;
  }

  return null;
};

/** Arma el aviso de las transferencias sin aplicar que el filtro dejó afuera: no son de una unidad. */
export const armarAvisoDeTransferencias = (monto: string, moneda: Moneda): string =>
  `Tiene transferencias sin aplicar por ${formatearMontoEnMoneda(monto, moneda)} que no son de una unidad; se ven sin filtro.`;
