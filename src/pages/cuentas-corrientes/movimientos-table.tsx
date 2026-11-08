import { usePermissions } from "@refinedev/core";
import { Space, Table, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { formatMonto } from "../../utils/monto";
import type { CuentaCorrienteMovimiento } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

// Un monto negativo (un descuento o un saldo a favor de la administradora) se resalta.
export const MontoCell = ({ monto }: { monto: string }) => (
  <Typography.Text type={Number(monto) < 0 ? "danger" : undefined}>{formatMonto(monto)}</Typography.Text>
);

type Props = {
  movimientos: CuentaCorrienteMovimiento[] | undefined;
  loading?: boolean;
  /** Agrega la columna "Liquidación", con el enlace al detalle de la que selló cada fila. */
  mostrarLiquidacion?: boolean;
  /** Arma el enlace de la columna "Liquidación"; por defecto va al detalle del panel interno. */
  rutaLiquidacion?: (id: number) => string;
  pageSize?: number;
};

// Tabla de movimientos de una cuenta corriente, para el detalle de la cuenta, la vista previa de una liquidación y
// la liquidación misma. Las líneas del mismo cargo, fecha, tipo y liquidación llegan juntas en una sola fila.
const rutaLiquidacionDeAdmin = (id: number): string => `/administrador/liquidaciones/show/${id}`;

export const MovimientosTable = ({
  movimientos,
  loading,
  mostrarLiquidacion = false,
  rutaLiquidacion = rutaLiquidacionDeAdmin,
  pageSize = 20,
}: Props) => {
  const { data: permissions } = usePermissions<string[]>({});
  const puedeVerPagos = permissions?.includes("pagos.ver") ?? false;

  return (
    <Table<CuentaCorrienteMovimiento>
      dataSource={movimientos}
      loading={loading}
      rowKey={(movimiento) => movimiento.lineas[0].id}
      pagination={{ pageSize, hideOnSinglePage: true }}
      scroll={{ x: "max-content" }}
      // Mostrar las líneas de un movimiento solo si se juntaron varias del mismo cargo, fecha y tipo.
      expandable={{
        rowExpandable: (movimiento) => movimiento.lineas.length > 1,
        expandedRowRender: (movimiento) => (
          <Space direction="vertical" size={0}>
            {movimiento.lineas.map((linea) => (
              <Typography.Text key={linea.id} type="secondary">
                Línea {linea.id}: {formatMonto(linea.monto)}
              </Typography.Text>
            ))}
          </Space>
        ),
      }}
    >
      <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)} />
      <Table.Column title="Unidad" dataIndex="unidad" />
      <Table.Column
        title="Concepto"
        dataIndex="concepto"
        // Una transferencia al propietario enlaza a su pago, si el usuario puede verlo.
        render={(concepto: string, movimiento: CuentaCorrienteMovimiento) =>
          movimiento.pago_proveedor_id !== null && puedeVerPagos ? (
            <Link to={`/administrador/pagos-proveedor/show/${movimiento.pago_proveedor_id}`}>{concepto}</Link>
          ) : (
            concepto
          )
        }
      />
      <Table.Column title="Monto" dataIndex="monto" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column title="Saldo" dataIndex="saldo" align="right" render={(saldo: string) => <MontoCell monto={saldo} />} />
      {mostrarLiquidacion && (
        <Table.Column
          title="Liquidación"
          dataIndex="liquidacion_id"
          render={(liquidacionId: number | null) =>
            liquidacionId === null ? "—" : <Link to={rutaLiquidacion(liquidacionId)}>N.º {liquidacionId}</Link>
          }
        />
      )}
    </Table>
  );
};
