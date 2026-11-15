import { MontoEnMoneda } from "./monto-en-moneda";
import { BALDES_COLUMNAS, type Baldes, type Moneda } from "./types";

// Arma las columnas de antigüedad y el total de una tabla de resumen, para los grupos y para el pie de totales.
export const columnasDeBaldes = <T,>(moneda: (fila: T) => Moneda, baldes: (fila: T) => Baldes, total: (fila: T) => string) => [
  ...BALDES_COLUMNAS.map(({ balde, titulo }) => ({
    title: titulo,
    key: balde,
    align: "right" as const,
    render: (_: unknown, fila: T) => <MontoEnMoneda monto={baldes(fila)[balde]} moneda={moneda(fila)} />,
  })),
  {
    title: "Total",
    key: "total",
    align: "right" as const,
    render: (_: unknown, fila: T) => <MontoEnMoneda fuerte monto={total(fila)} moneda={moneda(fila)} />,
  },
];
