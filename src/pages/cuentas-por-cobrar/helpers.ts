import dayjs from "dayjs";
import { cargoMarcaLabel, type CargoDeudor, type CargoMarca } from "../cargos/types";
import type { DocumentosDeDeuda, FiltrosCuentasPorCobrar } from "./types";

/** Arma el nombre del PDF; es el mismo que arma `nombreDeArchivo()` del backend. `hoy` es YYYY-MM-DD. */
export const nombreDelPdfDeCuentasPorCobrar = (hoy: string): string => `cuentas-por-cobrar-${hoy}.pdf`;

/** Arma la ruta del PDF con los filtros activos; sin filtros pide el reporte entero. */
export const rutaDelPdfDeCuentasPorCobrar = ({ edificioId, unidadId }: FiltrosCuentasPorCobrar): string => {
  const params = new URLSearchParams();

  if (edificioId) {
    params.set("edificio_id", String(edificioId));
  }

  if (unidadId) {
    params.set("unidad_id", String(unidadId));
  }

  const query = params.toString();
  return query ? `reportes/cuentas-por-cobrar/pdf?${query}` : "reportes/cuentas-por-cobrar/pdf";
};

/**
 * Arma el texto de la columna "Documento": "Sin facturar" si no hay ninguno, los números de las facturas (o de la NC)
 * y, si falta facturar algo, " · resto sin facturar".
 */
export const armarTextoDeDocumentos = ({ tipo, numeros, sin_facturar }: DocumentosDeDeuda): string => {
  if (numeros.length === 0) {
    return "Sin facturar";
  }

  const nombre = tipo === "NOTA_CREDITO" ? "NC" : "Factura";
  const texto = `${nombre} ${numeros.join(", ")}`;

  if (sin_facturar) {
    return `${texto} · resto sin facturar`;
  }

  return texto;
};

/** Arma el texto del tag de la marca de una deuda: la factura anulada espera la del proveedor; la otra se revisa. */
export const armarEtiquetaDeMarca = (marca: CargoMarca, deudor: CargoDeudor): string => {
  if (marca === "FACTURA_ANULADA") {
    return "Esperando factura del proveedor";
  }

  return cargoMarcaLabel(marca, deudor);
};

/** Arma el origen de una deuda: su período MM/YYYY o, si no tiene período, su fecha DD/MM/YYYY. */
export const formatearOrigen = (periodo: string | null, fechaOrigen: string): string => {
  if (periodo) {
    const [anio, mes] = periodo.split("-");
    return `${mes}/${anio}`;
  }

  return dayjs(fechaOrigen).format("DD/MM/YYYY");
};
