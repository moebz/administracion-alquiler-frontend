import { useState } from "react";
import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import {
  COMPRA_CONDICION_LABEL,
  COMPRA_ESTADO_COLOR,
  COMPRA_ESTADO_LABEL,
  type CompraCuotaRow,
  type CompraDetalleRow,
  type CompraRow,
} from "./types";

// Contenido de la factura de una compra, sin el wrapper <Show> — lo usa
// CompraShow (pantalla propia, todavía viva por el link desde
// pagos-proveedor/show.tsx) y GastoShow (todo el flujo de gastos vive ahí,
// ver ARQUITECTURA.md "Gastos"), cada uno con su propio permiso de anular.
export const CompraDetail = ({
  compra,
  puedeAnular,
  onAnulada,
  headerExtra,
}: {
  compra: CompraRow | undefined;
  puedeAnular: boolean;
  onAnulada: () => void;
  headerExtra?: ReactNode;
}) => {
  const { message } = App.useApp();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    if (!compra) return;
    setGuardando(true);
    const response = await kyInstance.patch(`compras/${compra.id}/anular`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Compra anulada.");
      setModalAbierto(false);
      onAnulada();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular la compra."));
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        title="Datos de la factura"
        size="small"
        extra={
          (headerExtra || (puedeAnular && compra?.estado === "REGISTRADO")) && (
            <Space size={4}>
              {headerExtra}
              {puedeAnular && compra?.estado === "REGISTRADO" && (
                <Button danger size="small" onClick={() => setModalAbierto(true)}>
                  Anular
                </Button>
              )}
            </Space>
          )
        }
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Proveedor">{compra?.persona?.nombre}</Descriptions.Item>
          <Descriptions.Item label="RUC">
            {compra?.emisor_ruc}
            {compra?.emisor_dv ? `-${compra.emisor_dv}` : ""}
          </Descriptions.Item>
          <Descriptions.Item label="Timbrado">{compra?.timbrado_proveedor}</Descriptions.Item>
          <Descriptions.Item label="Número">{compra?.numero}</Descriptions.Item>
          <Descriptions.Item label="Fecha">
            {compra ? dayjs(compra.fecha).format("DD/MM/YYYY") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Condición">
            {compra ? COMPRA_CONDICION_LABEL[compra.condicion] : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            {compra && <Tag color={COMPRA_ESTADO_COLOR[compra.estado]}>{COMPRA_ESTADO_LABEL[compra.estado]}</Tag>}
          </Descriptions.Item>
          {compra?.estado === "ANULADO" && (
            <Descriptions.Item label="Motivo de anulación">{compra.motivo_anulacion}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Totales" size="small">
        <Descriptions column={3} size="small">
          <Descriptions.Item label="Exentas">{formatMonto(compra?.exentas ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Gravadas 5%">{formatMonto(compra?.gravadas_5 ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Gravadas 10%">{formatMonto(compra?.gravadas_10 ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="IVA 5%">{formatMonto(compra?.iva_5 ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="IVA 10%">{formatMonto(compra?.iva_10 ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Total">
            <Typography.Text strong>{formatMonto(compra?.total ?? 0)}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Saldo">{formatMonto(compra?.saldo ?? 0)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Detalles" size="small">
        <Table dataSource={compra?.detalles} rowKey="id" pagination={false} size="small">
          <Table.Column title="Descripción" dataIndex="descripcion" />
          <Table.Column title="Cantidad" dataIndex="cantidad" />
          <Table.Column
            title="Precio unitario"
            dataIndex="precio_unitario"
            render={(precio: CompraDetalleRow["precio_unitario"]) => formatMonto(precio)}
          />
          <Table.Column title="IVA" dataIndex="tasa_iva" render={(tasa: number) => `${tasa}%`} />
          <Table.Column
            title="Subtotal"
            dataIndex="subtotal"
            render={(subtotal: CompraDetalleRow["subtotal"]) => formatMonto(subtotal)}
          />
        </Table>
      </Card>

      <Card title="Cuotas y pagos" size="small">
        <Table dataSource={compra?.cuotas} rowKey="id" pagination={false} size="small">
          <Table.Column title="N°" dataIndex="numero_cuota" />
          <Table.Column
            title="Vencimiento"
            dataIndex="fecha_vencimiento"
            render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")}
          />
          <Table.Column title="Monto" dataIndex="monto" render={(monto: CompraCuotaRow["monto"]) => formatMonto(monto)} />
          <Table.Column title="Saldo" dataIndex="saldo" render={(saldo: CompraCuotaRow["saldo"]) => formatMonto(saldo)} />
          <Table.Column
            title="Pagos aplicados"
            dataIndex="pagos"
            render={(pagos: CompraCuotaRow["pagos"]) =>
              pagos.length === 0 ? (
                "—"
              ) : (
                <Space direction="vertical" size={0}>
                  {pagos.map((pago) => (
                    <span key={pago.id}>
                      <Link to={`/administrador/pagos-proveedor/show/${pago.pago_proveedor_id}`}>
                        Pago #{pago.pago_proveedor_numero}
                      </Link>{" "}
                      — {formatMonto(pago.monto_aplicado)}
                      {pago.estado === "ANULADA" && <Tag color="default" style={{ marginLeft: 4 }}>Anulado</Tag>}
                    </span>
                  ))}
                </Space>
              )
            }
          />
        </Table>
      </Card>

      <Modal
        title="Anular compra"
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        afterClose={() => form.resetFields()}
        onOk={() => form.submit()}
        okText="Anular"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
        confirmLoading={guardando}
      >
        <Form form={form} layout="vertical" onFinish={anular}>
          <Form.Item label="Motivo" name="motivo_anulacion" rules={[{ required: true }, { max: 255 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
