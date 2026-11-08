import { extractErrorMessage } from "../providers/auth";
import { kyInstance } from "../providers/data";

/** Arma el nombre del PDF de una liquidación; es el mismo que arma `nombreDeArchivo()` del backend. `corte` es YYYY-MM-DD. */
export const nombreDelPdfDeLiquidacion = (id: number, corte: string): string => `liquidacion-${id}-${corte}.pdf`;

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

/** Descarga el PDF de la liquidación. `corte` es YYYY-MM-DD. */
export const descargarPdfDeLiquidacion = (id: number, corte: string): Promise<void> =>
  descargarArchivo(`liquidaciones/${id}/pdf`, nombreDelPdfDeLiquidacion(id, corte));
