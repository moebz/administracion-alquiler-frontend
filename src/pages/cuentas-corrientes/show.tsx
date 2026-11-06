import { useEffect, useState } from "react";
import { ContainerOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useResourceParams } from "@refinedev/core";
import { App, DatePicker, Descriptions, Space, Table, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { CuentaCorrienteDetalle, CuentaCorrienteMovimiento } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

// Un monto negativo (un descuento o un saldo a favor de la administradora) se resalta.
const MontoCell = ({ monto }: { monto: string }) => (
  <Typography.Text type={Number(monto) < 0 ? "danger" : undefined}>{formatMonto(monto)}</Typography.Text>
);

export const CuentaCorrienteShow = () => {
  const { id } = useResourceParams();
  const { message } = App.useApp();

  const [saldoAl, setSaldoAl] = useState<Dayjs>(() => dayjs());
  const [detalle, setDetalle] = useState<CuentaCorrienteDetalle>();
  const [cargando, setCargando] = useState(true);

  const fechaIso = saldoAl.format("YYYY-MM-DD");

  // Pedir el detalle con kyInstance y no con useShow, que no manda el parámetro `saldo_al`.
  useEffect(() => {
    if (!id) {
      return;
    }

    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${id}`, { searchParams: { saldo_al: fechaIso } })
      .json<CuentaCorrienteDetalle>()
      .then((datos) => vigente && setDetalle(datos))
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar la cuenta corriente.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id, fechaIso, message]);

  const hayPorVencer = detalle !== undefined && Number(detalle.por_vencer) !== 0;

  return (
    <Show
      isLoading={cargando}
      title={<PageTitle icon={<ContainerOutlined />}>Cuenta corriente</PageTitle>}
    >
      <FilterBar>
        <Space>
          <span>Saldo al</span>
          <DatePicker
            allowClear={false}
            format={FORMATO_FECHA}
            value={saldoAl}
            onChange={(fecha) => fecha && setSaldoAl(fecha)}
          />
        </Space>
      </FilterBar>

      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Propietario">{detalle?.propietario.nombre}</Descriptions.Item>
        <Descriptions.Item label="Documento">{detalle?.propietario.documento}</Descriptions.Item>
        <Descriptions.Item label={`Saldo al ${saldoAl.format(FORMATO_FECHA)}`}>
          {detalle && <MontoCell monto={detalle.saldo} />}
        </Descriptions.Item>
        {hayPorVencer && (
          <Descriptions.Item label="Por vencer después de esa fecha">
            {detalle && <MontoCell monto={detalle.por_vencer} />}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Table<CuentaCorrienteMovimiento>
        dataSource={detalle?.movimientos}
        loading={cargando}
        rowKey={(movimiento) => movimiento.lineas[0].id}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
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
        <Table.Column
          title="Fecha"
          dataIndex="fecha"
          render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)}
        />
        <Table.Column title="Unidad" dataIndex="unidad" />
        <Table.Column title="Concepto" dataIndex="concepto" />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          align="right"
          render={(monto: string) => <MontoCell monto={monto} />}
        />
        <Table.Column
          title="Saldo"
          dataIndex="saldo"
          align="right"
          render={(saldo: string) => <MontoCell monto={saldo} />}
        />
      </Table>
    </Show>
  );
};
