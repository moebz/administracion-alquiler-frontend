import { extractErrorMessage } from "../providers/auth";
import { kyInstance } from "../providers/data";

/** Arma el nombre del PDF de una rendición; es el mismo que arma `nombreDeArchivo()` del backend. `corte` es YYYY-MM-DD. */
export const nombreDelPdfDeRendicion = (id: number, corte: string): string => `rendicion-${id}-${corte}.pdf`;

/**
 * Descarga el archivo de la ruta con el nombre dado. Pide la ruta con `kyInstance` porque manda el token, cosa que
 * un `<a href>` no haría. Si el servidor rechaza, lanza el error con su mensaje, para que quien llama lo muestre.
 */
export const descargarArchivo = async (ruta: string, nombre: string): Promise<void> => {
  // Pedir JSON en el Accept para que Laravel responda los errores (422, 403) en JSON y no en HTML.
  const response = await kyInstance.get(ruta, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo descargar el archivo."));
  }

  // Disparar la descarga con un link temporal al archivo.
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** Arma la ruta del PDF de la rendición. El portal del propietario pasa `"propietario/"` como prefijo. */
export const rutaDelPdfDeRendicion = (id: number, prefijo = ""): string => `${prefijo}rendiciones/${id}/pdf`;

/** Descarga el PDF de la rendición. `corte` es YYYY-MM-DD. */
export const descargarPdfDeRendicion = (id: number, corte: string, prefijo = ""): Promise<void> =>
  descargarArchivo(rutaDelPdfDeRendicion(id, prefijo), nombreDelPdfDeRendicion(id, corte));

/** Tipo de documento de venta con PDF, como lo devuelve el backend. */
export type TipoDocumentoVenta = "FACTURA" | "NOTA_CREDITO";

/** Arma la ruta del PDF de una factura o NC de venta. El portal del propietario pasa `"propietario/"` como prefijo. */
export const rutaDelPdfDeDocumentoVenta = (id: number, prefijo = ""): string =>
  `${prefijo}facturas-venta/${id}/pdf`;

/** Arma el nombre del PDF de una factura o NC; es el mismo que arma `nombreDeArchivo()` del backend. `numeroImpreso` es 001-001-0000123. */
export const nombreDelPdfDeDocumentoVenta = (tipo: TipoDocumentoVenta, numeroImpreso: string): string =>
  `${tipo === "FACTURA" ? "factura" : "nota-credito"}-${numeroImpreso}.pdf`;

/** Descarga el PDF de una factura o NC de venta. */
export const descargarPdfDeDocumentoVenta = (
  id: number,
  tipo: TipoDocumentoVenta,
  numeroImpreso: string,
  prefijo = ""
): Promise<void> =>
  descargarArchivo(rutaDelPdfDeDocumentoVenta(id, prefijo), nombreDelPdfDeDocumentoVenta(tipo, numeroImpreso));
