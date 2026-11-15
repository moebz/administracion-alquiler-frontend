import { Table, Typography } from "antd";
import { MontoEnMoneda } from "./monto-en-moneda";
import { BALDES_COLUMNAS, type Moneda, type TotalesDeLado } from "./types";

type TotalesDeMoneda<L extends string> = { moneda: Moneda } & Record<L, TotalesDeLado>;

// Fila de totales al pie de una tabla de resumen: una por moneda, porque nunca se suman monedas distintas.
// `lado` es el lado del reporte que resume la tabla (inquilinos, proveedores, propietarios...).
export const PieDeTotales = <L extends string>({
  totales,
  lado,
  columnasAntes,
}: {
  totales: TotalesDeMoneda<L>[];
  lado: L;
  columnasAntes: number;
}) => (
  <Table.Summary fixed>
    {totales
      .filter((total) => Number(total[lado].total) !== 0 || BALDES_COLUMNAS.some(({ balde }) => Number(total[lado].baldes[balde]) !== 0))
      .map((total) => (
        <Table.Summary.Row key={total.moneda.id}>
          {/* Celda vacía bajo la columna del botón de expandir. */}
          <Table.Summary.Cell index={0} />
          <Table.Summary.Cell index={1} colSpan={columnasAntes}>
            <Typography.Text strong>Total ({total.moneda.codigo})</Typography.Text>
          </Table.Summary.Cell>
          {BALDES_COLUMNAS.map(({ balde }, indice) => (
            <Table.Summary.Cell key={balde} index={indice + 1 + columnasAntes} align="right">
              <MontoEnMoneda monto={total[lado].baldes[balde]} moneda={total.moneda} />
            </Table.Summary.Cell>
          ))}
          <Table.Summary.Cell index={BALDES_COLUMNAS.length + 1 + columnasAntes} align="right">
            <MontoEnMoneda fuerte monto={total[lado].total} moneda={total.moneda} />
          </Table.Summary.Cell>
        </Table.Summary.Row>
      ))}
  </Table.Summary>
);
