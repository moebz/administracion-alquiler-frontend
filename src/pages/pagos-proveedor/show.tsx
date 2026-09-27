import { useState } from "react";
import { Show } from "@refinedev/antd";
import { useShow, usePermissions } from "@refinedev/core";
import { App, Button, Card, Descriptions, Form, Input, Modal, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import {
  PAGO_PROVEEDOR_ESTADO_COLOR,
  PAGO_PROVEEDOR_ESTADO_LABEL,
  type PagoProveedorAplicacionRow,
  type PagoProveedorRow,
  type PagoProveedorValorRow,
} from "./types";

const PERMISO_ANULAR = "pagos.anular";

export const PagoProveedorShow = () => {
  const { query, result: pago } = useShow<PagoProveedorRow>();
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeAnular = permissions?.includes(PERMISO_ANULAR) ?? false;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    if (!pago) return;
    setGuardando(true);
    const response = await kyInstance.patch(`pagos-proveedor/${pago.id}/anular`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Pago anulado.");
      setModalAbierto(false);
      query.refetch();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular el pago."));
  };

  return (
    <Show
      title="Detalle del pago"
      isLoading={query.isLoading}
      headerButtons={() =>
        puedeAnular && pago?.estado === "ACTIVO" ? (
          <Button danger onClick={() => setModalAbierto(true)}>
            Anular
          </Button>
        ) : null
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Datos del pago" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Número">{pago?.numero}</Descriptions.Item>
            <Descriptions.Item label="Proveedor">{pago?.persona.nombre}</Descriptions.Item>
            <Descriptions.Item label="Fecha">{pago ? dayjs(pago.fecha).format("DD/MM/YYYY") : "—"}</Descriptions.Item>
            <Descriptions.Item label="Monto total">{formatMonto(pago?.monto_total ?? 0)}</Descriptions.Item>
            <Descriptions.Item label="Concepto">{pago?.concepto ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              {pago && (
                <Tag color={PAGO_PROVEEDOR_ESTADO_COLOR[pago.estado]}>{PAGO_PROVEEDOR_ESTADO_LABEL[pago.estado]}</Tag>
              )}
            </Descriptions.Item>
            {pago?.estado === "ANULADO" && (
              <Descriptions.Item label="Motivo de anulación">{pago.motivo_anulacion}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Medios de pago" size="small">
          <Table dataSource={pago?.valores} rowKey="id" pagination={false} size="small">
            <Table.Column title="Medio" dataIndex="medio_pago" render={(mp: PagoProveedorValorRow["medio_pago"]) => mp.nombre} />
            <Table.Column title="Fondo" dataIndex="fondo" render={(fondo: PagoProveedorValorRow["fondo"]) => fondo.nombre} />
            <Table.Column title="Monto" dataIndex="monto" render={(monto: PagoProveedorValorRow["monto"]) => formatMonto(monto)} />
            <Table.Column
              title="N° comprobante"
              dataIndex="nro_comprobante"
              render={(nro: string | null) => nro ?? "—"}
            />
            <Table.Column
              title="Estado"
              dataIndex="estado"
              render={(estadoValor: PagoProveedorValorRow["estado"]) => (
                <Tag color={estadoValor === "ACTIVO" ? "green" : "red"}>
                  {estadoValor === "ACTIVO" ? "Activo" : "Rechazado"}
                </Tag>
              )}
            />
          </Table>
        </Card>

        <Card title="Aplicado a" size="small">
          <Table dataSource={pago?.aplicaciones} rowKey="id" pagination={false} size="small">
            <Table.Column
              title="Factura"
              dataIndex="documento_compra_numero"
              render={(numero: string, record: PagoProveedorAplicacionRow) => (
                <Link to={`/administrador/compras/show/${record.documento_compra_id}`}>{numero}</Link>
              )}
            />
            <Table.Column
              title="Monto aplicado"
              dataIndex="monto_aplicado"
              render={(monto: PagoProveedorAplicacionRow["monto_aplicado"]) => formatMonto(monto)}
            />
            <Table.Column
              title="Estado"
              dataIndex="estado"
              render={(estadoAplicacion: PagoProveedorAplicacionRow["estado"]) => (
                <Tag color={estadoAplicacion === "ACTIVA" ? "green" : "default"}>
                  {estadoAplicacion === "ACTIVA" ? "Activa" : "Anulada"}
                </Tag>
              )}
            />
          </Table>
        </Card>
      </Space>

      <Modal
        title="Anular pago"
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
    </Show>
  );
};
