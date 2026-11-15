import dayjs, { type Dayjs } from "dayjs";
import type { CategoriaClave, FilaDeResumen, MonedaDelReporte, MovimientoDelReporte } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";
const FORMATO_API = "YYYY-MM-DD";

/** Da formato DD/MM/YYYY a una fecha YYYY-MM-DD. */
export const formatearFecha = (fecha: string): string => dayjs(fecha).format(FORMATO_FECHA);

/** Arma el período por defecto: del 1° del mes de `hoy` a `hoy`. */
export const obtenerPeriodoPorDefecto = (hoy: Dayjs = dayjs()): [Dayjs, Dayjs] => [hoy.startOf("month"), hoy.startOf("day")];

/** Arma el nombre del PDF; es el mismo que arma `nombreDeArchivo()` del backend. `desde` y `hasta` son YYYY-MM-DD. */
export const nombreDelPdfDeIngresosEgresos = (desde: string, hasta: string): string => `ingresos-egresos-${desde}-a-${hasta}.pdf`;

/** Arma la ruta del PDF con el período elegido. `desde` y `hasta` son YYYY-MM-DD. */
export const rutaDelPdfDeIngresosEgresos = (desde: string, hasta: string): string =>
  `reportes/ingresos-egresos/pdf?${new URLSearchParams({ desde, hasta }).toString()}`;

/** Pasa un día a YYYY-MM-DD, como lo pide la API. */
export const formatearParaApi = (dia: Dayjs): string => dia.format(FORMATO_API);

/**
 * Arma el texto de "Qué se anuló" de una anulación: el cobro o el pago con su número y su fecha. Un movimiento de otro
 * origen se nombra por su concepto.
 */
export const armarTextoDeQueSeAnulo = (movimiento: MovimientoDelReporte): string => {
  const fecha = formatearFecha(movimiento.fecha_movimiento ?? movimiento.fecha);

  if (movimiento.origen === "COBRO") {
    return `Cobro N° ${movimiento.numero} del ${fecha}`;
  }

  if (movimiento.origen === "PAGO") {
    return `Pago N° ${movimiento.numero} del ${fecha}`;
  }

  return `${movimiento.concepto ?? "Movimiento"} del ${fecha}`;
};

/** Arma el texto del tag de un movimiento que hoy está anulado. */
export const armarTextoDeAnulado = (anuladoEl: string): string => `Anulado el ${formatearFecha(anuladoEl)}`;

/** Dice el signo con que una categoría mueve los fondos: los cobros suman, los pagos restan y el resto depende del movimiento. */
export const obtenerSignoDeCategoria = (clave: CategoriaClave): "+" | "−" | "±" => {
  if (clave === "COBROS") {
    return "+";
  }

  if (clave === "PAGOS_PROVEEDORES" || clave === "TRANSFERENCIAS_PROPIETARIOS") {
    return "−";
  }

  return "±";
};

/**
 * Arma las filas de la tabla de resumen de una moneda: el saldo inicial, una por categoría, el neto y el saldo final.
 * `desde` y `hasta` son YYYY-MM-DD.
 */
export const armarFilasDeResumen = (bloque: MonedaDelReporte, desde: string, hasta: string): FilaDeResumen[] => {
  const diaAnterior = dayjs(desde).subtract(1, "day").format(FORMATO_API);

  return [
    {
      key: "saldo-inicial",
      tipo: "SALDO_INICIAL",
      etiqueta: `Saldo al ${formatearFecha(diaAnterior)} según lo cargado hoy`,
      monto: bloque.saldo_inicial,
    },
    ...bloque.categorias.map(
      (categoria): FilaDeResumen => ({
        key: categoria.clave,
        tipo: "CATEGORIA",
        etiqueta: `${obtenerSignoDeCategoria(categoria.clave)} ${categoria.nombre}`,
        monto: categoria.total,
        categoria,
      }),
    ),
    { key: "neto", tipo: "NETO", etiqueta: "Neto del período", monto: bloque.neto },
    {
      key: "saldo-final",
      tipo: "SALDO_FINAL",
      etiqueta: `Saldo al ${formatearFecha(hasta)} según lo cargado hoy`,
      monto: bloque.saldo_final,
    },
  ];
};
