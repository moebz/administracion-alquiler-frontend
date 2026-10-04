import { useState } from "react";
import { FileTextOutlined, LinkOutlined, StopOutlined, WalletOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useShow, usePermissions } from "@refinedev/core";
import { App, Button, Descriptions, Flex, Form, Input, Modal, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { SectionDivider } from "../../components/section-divider";
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
  const [valorAAnular, setValorAAnular] = useState<PagoProveedorValorRow | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const pagoActivo = pago?.estado === "ACTIVO";
  const valoresActivos = pago?.valores.filter((valor) => valor.estado === "ACTIVO").length ?? 0;

  const abrirAnulacion = (valor: PagoProveedorValorRow | null) => {
    setValorAAnular(valor);
    setModalAbierto(true);
  };

  const anular = async (values: { motivo_anulacion: string }) => {
    if (!pago) return;
    setGuardando(true);
    const url = valorAAnular
      ? `pagos-proveedor/${pago.id}/valores/${valorAAnular.id}/anular`
      : `pagos-proveedor/${pago.id}/anular`;
    const response = await kyInstance.patch(url, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success(valorAAnular ? "Medio de pago anulado." : "Pago anulado.");
      setModalAbierto(false);
      query.refetch();
      return;
    }
    message.error(
      await extractErrorMessage(response, valorAAnular ? "No se pudo anular el medio de pago." : "No se pudo anular el pago."),
    );
  };

  return (
    <Show
      title="Detalle del pago"
      isLoading={query.isLoading}
      headerButtons={() =>
        puedeAnular && pagoActivo ? (
          <Button danger onClick={() => abrirAnulacion(null)}>
            Anular
          </Button>
        ) : null
      }
    >
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Space size="middle" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {pago && `Pago #${pago.numero}`}
          </Typography.Title>
          {pago && (
            <Tag color={PAGO_PROVEEDOR_ESTADO_COLOR[pago.estado]}>{PAGO_PROVEEDOR_ESTADO_LABEL[pago.estado]}</Tag>
          )}
        </Space>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {formatMonto(pago?.monto_total ?? 0)}
        </Typography.Title>
      </Flex>

      <SectionDivider icon={<FileTextOutlined />}>Datos del pago</SectionDivider>
      <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" style={{ paddingLeft: 24 }}>
        <Descriptions.Item label="Proveedor">{pago?.persona.nombre}</Descriptions.Item>
        <Descriptions.Item label="Fecha">{pago ? dayjs(pago.fecha).format("DD/MM/YYYY") : "—"}</Descriptions.Item>
        {pago?.concepto && <Descriptions.Item label="Concepto">{pago.concepto}</Descriptions.Item>}
        {pago?.estado === "ANULADO" && (
          <Descriptions.Item label="Motivo de anulación">{pago.motivo_anulacion}</Descriptions.Item>
        )}
      </Descriptions>

      <SectionDivider icon={<WalletOutlined />}>Medios de pago</SectionDivider>
      <Table dataSource={pago?.valores} rowKey="id" pagination={false} size="small">
        <Table.Column title="Medio" dataIndex="medio_pago" render={(mp: PagoProveedorValorRow["medio_pago"]) => mp.nombre} />
        <Table.Column title="Fondo" dataIndex="fondo" render={(fondo: PagoProveedorValorRow["fondo"]) => fondo.nombre} />
        <Table.Column title="Monto" dataIndex="monto" align="right" render={(monto: PagoProveedorValorRow["monto"]) => formatMonto(monto)} />
        <Table.Column
          title="N° comprobante"
          dataIndex="nro_comprobante"
          render={(nro: string | null) => nro ?? "—"}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoValor: PagoProveedorValorRow["estado"], record: PagoProveedorValorRow) =>
            estadoValor === "ACTIVO" ? (
              <Space size={4} wrap>
                <Tag color="green">Activo</Tag>
                {puedeAnular && pagoActivo && (
                  <Tooltip
                    title={
                      valoresActivos > 1
                        ? "Anular medio de pago"
                        : "Es el único medio de pago activo: para anularlo, anulá el pago entero"
                    }
                  >
                    <Button
                      size="small"
                      danger
                      icon={<StopOutlined />}
                      disabled={valoresActivos <= 1}
                      onClick={() => abrirAnulacion(record)}
                    />
                  </Tooltip>
                )}
              </Space>
            ) : (
              <Tooltip title={record.motivo_anulacion}>
                <Tag color="default">Anulado</Tag>
              </Tooltip>
            )
          }
        />
      </Table>

      <SectionDivider icon={<LinkOutlined />}>Aplicado a</SectionDivider>
      <Table dataSource={pago?.aplicaciones} rowKey="id" pagination={false} size="small">
        <Table.Column
          title="Factura"
          dataIndex="documento_compra_numero"
          render={(numero: string, record: PagoProveedorAplicacionRow) => (
            <Link to={`/administrador/compras/show/${record.documento_compra_id}`}>{numero}</Link>
          )}
        />
        <Table.Column title="N° cuota" dataIndex="numero_cuota" />
        <Table.Column
          title="Monto aplicado"
          dataIndex="monto_aplicado"
          align="right"
          render={(monto: PagoProveedorAplicacionRow["monto_aplicado"]) => formatMonto(monto)}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoAplicacion: PagoProveedorAplicacionRow["estado"], record: PagoProveedorAplicacionRow) => (
            <Tooltip title={record.valor_anulado_id ? "Anulada por la anulación de un medio de pago" : undefined}>
              <Tag color={estadoAplicacion === "ACTIVA" ? "green" : "default"}>
                {estadoAplicacion === "ACTIVA" ? "Activa" : "Anulada"}
              </Tag>
            </Tooltip>
          )}
        />
      </Table>

      <Modal
        title={valorAAnular ? "Anular medio de pago" : "Anular pago"}
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
          {valorAAnular && (
            <p>
              {valorAAnular.medio_pago.nombre} por {formatMonto(valorAAnular.monto)}. El monto vuelve al fondo y se
              anula lo aplicado a las facturas por ese importe, empezando por la última cuota.
            </p>
          )}
          <Form.Item label="Motivo" name="motivo_anulacion" rules={[{ required: true }, { max: 255 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
