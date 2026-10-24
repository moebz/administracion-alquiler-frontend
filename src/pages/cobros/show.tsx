import { FileDoneOutlined, FileTextOutlined, LinkOutlined, WalletOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Descriptions, Flex, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { SectionDivider } from "../../components/section-divider";
import { formatMonto } from "../../utils/monto";
import {
  COBRO_ESTADO_COLOR,
  COBRO_ESTADO_LABEL,
  type CobroAplicacionRow,
  type CobroFacturaDetalleRow,
  type CobroRow,
  type CobroValorRow,
} from "./types";

export const CobroShow = () => {
  const { query, result: cobro } = useShow<CobroRow>();
  const factura = cobro?.factura ?? null;

  return (
    <Show title="Detalle del cobro" isLoading={query.isLoading} headerButtons={() => null}>
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Space size="middle" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {cobro && `Recibo #${cobro.numero}`}
          </Typography.Title>
          {cobro && <Tag color={COBRO_ESTADO_COLOR[cobro.estado]}>{COBRO_ESTADO_LABEL[cobro.estado]}</Tag>}
        </Space>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {formatMonto(cobro?.monto_total ?? 0)}
        </Typography.Title>
      </Flex>

      <SectionDivider icon={<FileTextOutlined />}>Datos del cobro</SectionDivider>
      <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" style={{ paddingLeft: 24 }}>
        <Descriptions.Item label="Inquilino">{cobro?.persona.nombre}</Descriptions.Item>
        <Descriptions.Item label="Unidad">{cobro?.unidad ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Fecha">{cobro ? dayjs(cobro.fecha).format("DD/MM/YYYY") : "—"}</Descriptions.Item>
        {cobro?.concepto && <Descriptions.Item label="Concepto">{cobro.concepto}</Descriptions.Item>}
        {cobro?.estado === "ANULADO" && (
          <Descriptions.Item label="Motivo de anulación">{cobro.motivo_anulacion}</Descriptions.Item>
        )}
      </Descriptions>

      {factura && (
        <>
          <SectionDivider icon={<FileDoneOutlined />}>Factura emitida</SectionDivider>
          <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" style={{ paddingLeft: 24 }}>
            <Descriptions.Item label="Número">{factura.numero ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Fecha">{dayjs(factura.fecha).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Condición">Contado</Descriptions.Item>
          </Descriptions>
          <Table dataSource={factura.detalles} rowKey="id" pagination={false} size="small">
            <Table.Column title="Descripción" dataIndex="descripcion" />
            <Table.Column
              title="IVA"
              dataIndex="tasa_iva"
              render={(tasa: CobroFacturaDetalleRow["tasa_iva"]) => (tasa === 0 ? "Exenta" : `${tasa}%`)}
            />
            <Table.Column
              title="Subtotal"
              dataIndex="subtotal"
              align="right"
              render={(subtotal: CobroFacturaDetalleRow["subtotal"]) => formatMonto(subtotal)}
            />
            <Table.Column
              title="Cargo"
              dataIndex="cargo_id"
              render={(cargoId: CobroFacturaDetalleRow["cargo_id"]) =>
                cargoId ? <Link to={`/administrador/cargos?cargo_id=${cargoId}&todos_los_estados=1`}>Ver cargo</Link> : "—"
              }
            />
          </Table>
          <Descriptions column={{ xs: 1, md: 3 }} size="small" style={{ marginTop: 16, paddingLeft: 24 }}>
            <Descriptions.Item label="Exentas">{formatMonto(factura.exentas)}</Descriptions.Item>
            <Descriptions.Item label="Gravadas 5%">{formatMonto(factura.gravadas_5)}</Descriptions.Item>
            <Descriptions.Item label="IVA 5%">{formatMonto(factura.iva_5)}</Descriptions.Item>
            <Descriptions.Item label="Gravadas 10%">{formatMonto(factura.gravadas_10)}</Descriptions.Item>
            <Descriptions.Item label="IVA 10%">{formatMonto(factura.iva_10)}</Descriptions.Item>
            <Descriptions.Item label="Total">
              <Typography.Text strong>{formatMonto(factura.total)}</Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      <SectionDivider icon={<WalletOutlined />}>Medios de cobro</SectionDivider>
      <Table dataSource={cobro?.valores} rowKey="id" pagination={false} size="small">
        <Table.Column title="Medio" dataIndex="medio_pago" render={(medio: CobroValorRow["medio_pago"]) => medio.nombre} />
        <Table.Column title="Fondo" dataIndex="fondo" render={(fondo: CobroValorRow["fondo"]) => fondo.nombre} />
        <Table.Column title="Monto" dataIndex="monto" align="right" render={(monto: CobroValorRow["monto"]) => formatMonto(monto)} />
        <Table.Column title="N° comprobante" dataIndex="nro_comprobante" render={(nro: string | null) => nro ?? "—"} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoValor: CobroValorRow["estado"], record: CobroValorRow) =>
            estadoValor === "ACTIVO" ? (
              <Tag color="green">Activo</Tag>
            ) : (
              <Tooltip title={record.motivo_anulacion}>
                <Tag color="default">Anulado</Tag>
              </Tooltip>
            )
          }
        />
      </Table>

      <SectionDivider icon={<LinkOutlined />}>Aplicado a</SectionDivider>
      <Table dataSource={cobro?.aplicaciones} rowKey="id" pagination={false} size="small">
        <Table.Column title="Factura" dataIndex="documento_venta_id" render={() => factura?.numero ?? "—"} />
        <Table.Column title="N° cuota" dataIndex="numero_cuota" />
        <Table.Column
          title="Monto aplicado"
          dataIndex="monto_aplicado"
          align="right"
          render={(monto: CobroAplicacionRow["monto_aplicado"]) => formatMonto(monto)}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoAplicacion: CobroAplicacionRow["estado"], record: CobroAplicacionRow) => (
            <Tooltip title={record.valor_anulado_id ? "Anulada por la anulación de un medio de cobro" : undefined}>
              <Tag color={estadoAplicacion === "ACTIVA" ? "green" : "default"}>
                {estadoAplicacion === "ACTIVA" ? "Activa" : "Anulada"}
              </Tag>
            </Tooltip>
          )}
        />
      </Table>
    </Show>
  );
};
