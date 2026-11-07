import { formatMonto } from "../../utils/monto";
import type {
  FacturaPropietarioLinea,
  FacturaPropietarioLineaPrevia,
  PorDocumentar,
  PorDocumentarFactura,
  PorDocumentarNota,
} from "./types";

/** Arma las líneas editables de la factura a partir de la vista previa: el monto pasa de string a número. */
export const armarLineas = (previas: FacturaPropietarioLineaPrevia[]): FacturaPropietarioLinea[] =>
  previas.map((linea) => ({ ...linea, monto: Number(linea.monto) }));

/** Quita la línea del cargo, para que la factura coincida con el papel. */
export const quitarLinea = (lineas: FacturaPropietarioLinea[], cargoId: number): FacturaPropietarioLinea[] =>
  lineas.filter((linea) => linea.cargo_id !== cargoId);

/** Cambia la descripción o el monto de la línea del cargo; la tasa y el cargo no se editan. */
export const editarLinea = (
  lineas: FacturaPropietarioLinea[],
  cargoId: number,
  cambios: Partial<Pick<FacturaPropietarioLinea, "descripcion" | "monto">>,
): FacturaPropietarioLinea[] => lineas.map((linea) => (linea.cargo_id === cargoId ? { ...linea, ...cambios } : linea));

export const totalLineas = (lineas: FacturaPropietarioLinea[]): number =>
  lineas.reduce((acumulado, linea) => acumulado + (Number(linea.monto) || 0), 0);

/** Arma las líneas que se mandan al registrar: solo el cargo, la descripción y el monto (la tasa la fija el cargo). */
export const armarLineasDelBody = (lineas: FacturaPropietarioLinea[]) =>
  lineas.map((linea) => ({ cargo_id: linea.cargo_id, descripcion: linea.descripcion.trim(), monto: Number(linea.monto) }));

/** Dice si hay algo que documentar. */
export const hayPorDocumentar = (porDocumentar: PorDocumentar | undefined): porDocumentar is PorDocumentar =>
  porDocumentar !== undefined && (porDocumentar.notas.length > 0 || porDocumentar.facturas.length > 0);

/** Dice qué NC le falta al propietario sobre qué factura. */
export const fraseDeNota = (nota: PorDocumentarNota): string =>
  `Falta su NC por ${formatMonto(nota.monto)} sobre su factura ${nota.numero}`;

/** Dice qué factura le falta al propietario por un alquiler vencido. */
export const fraseDeFactura = (factura: PorDocumentarFactura): string =>
  `Falta su factura por ${formatMonto(factura.monto)}: ${factura.descripcion}`;

/** Arma, para mostrar, una frase por cada NC y cada factura que le faltan al propietario. */
export const frasesPorDocumentar = (porDocumentar: PorDocumentar): { clave: string; texto: string }[] => [
  ...porDocumentar.notas.map((nota) => ({ clave: `nota-${nota.factura_id}`, texto: fraseDeNota(nota) })),
  ...porDocumentar.facturas.map((factura) => ({ clave: `factura-${factura.cargo_id}`, texto: fraseDeFactura(factura) })),
];
