import { useState } from "react";
import {
  FileTextOutlined,
  LinkOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { usePermissions, useShow } from "@refinedev/core";
import {
  App,
  Button,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { SectionDivider } from "../../components/section-divider";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { FacturaCobro } from "./factura-cobro";
import {
  COBRO_ESTADO_COLOR,
  COBRO_ESTADO_LABEL,
  type CobroAplicacionRow,
  type CobroRow,
  type CobroValorRow,
} from "./types";

const PERMISO_ANULAR = "cobros.anular";

export const CobroShow = () => {
  const { query, result: cobro } = useShow<CobroRow>();
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeAnular = permissions?.includes(PERMISO_ANULAR) ?? false;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    if (!cobro) return;
    setGuardando(true);
    const response = await kyInstance.patch(`cobros/${cobro.id}/anular`, {
      json: values,
    });
    setGuardando(false);

    // Cerrar el modal y recargar el cobro, que ya viene ANULADO.
    if (response.ok) {
      message.success("Cobro anulado.");
      setModalAbierto(false);
      query.refetch();
      return;
    }

    // Mostrar el motivo del rechazo (por ejemplo, un cobro ya anulado).
    message.error(
      await extractErrorMessage(response, "No se pudo anular el cobro.")
    );
  };

  // Mostrar el estado de medios y aplicaciones solo si alguno difiere del estado del cobro:
  // si todos coinciden, el Tag del encabezado ya lo dice.
  const cobroActivo = cobro?.estado === "ACTIVO";
  const mostrarEstadoValores = (cobro?.valores ?? []).some(
    (valor) => (valor.estado === "ACTIVO") !== cobroActivo
  );
  const mostrarEstadoAplicaciones = (cobro?.aplicaciones ?? []).some(
    (aplicacion) => (aplicacion.estado === "ACTIVA") !== cobroActivo
  );

  return (
    <Show
      title="Detalle del cobro"
      isLoading={query.isLoading}
      headerButtons={() =>
        puedeAnular && cobroActivo ? (
          <Button danger onClick={() => setModalAbierto(true)}>
            Anular
          </Button>
        ) : null
      }
    >
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Space size="middle" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {cobro && `Cobro #${cobro.numero}`}
          </Typography.Title>
          {cobro && (
            <Tag color={COBRO_ESTADO_COLOR[cobro.estado]}>
              {COBRO_ESTADO_LABEL[cobro.estado]}
            </Tag>
          )}
        </Space>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {formatMonto(cobro?.monto_total ?? 0)}
        </Typography.Title>
      </Flex>

      <SectionDivider icon={<FileTextOutlined />}>
        Datos del cobro
      </SectionDivider>
      <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small">
        <Descriptions.Item label="Inquilino">
          {cobro?.persona.nombre}
        </Descriptions.Item>
        <Descriptions.Item label="Unidad">
          {cobro?.unidad ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {cobro ? dayjs(cobro.fecha).format("DD/MM/YYYY") : "—"}
        </Descriptions.Item>
        {cobro?.concepto && (
          <Descriptions.Item label="Concepto">
            {cobro.concepto}
          </Descriptions.Item>
        )}
        {cobro?.estado === "ANULADO" && (
          <Descriptions.Item label="Motivo de anulación">
            {cobro.motivo_anulacion}
          </Descriptions.Item>
        )}
      </Descriptions>

      {cobro?.facturas.map((factura) => (
        <FacturaCobro
          key={factura.id}
          factura={factura}
          onAnulada={() => query.refetch()}
        />
      ))}

      <SectionDivider icon={<WalletOutlined />}>Medios de cobro</SectionDivider>
      <Table
        dataSource={cobro?.valores}
        rowKey="id"
        pagination={false}
        size="small"
      >
        <Table.Column
          title="Medio"
          dataIndex="medio_pago"
          render={(medio: CobroValorRow["medio_pago"]) => medio.nombre}
        />
        <Table.Column
          title="Fondo"
          dataIndex="fondo"
          render={(fondo: CobroValorRow["fondo"]) => fondo.nombre}
        />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          align="right"
          render={(monto: CobroValorRow["monto"]) => formatMonto(monto)}
        />
        <Table.Column
          title="N° comprobante"
          dataIndex="nro_comprobante"
          render={(nro: string | null) => nro ?? "—"}
        />
        {mostrarEstadoValores && (
          <Table.Column
            title="Estado"
            dataIndex="estado"
            render={(
              estadoValor: CobroValorRow["estado"],
              record: CobroValorRow
            ) =>
              estadoValor === "ACTIVO" ? (
                <Tag color="green">Activo</Tag>
              ) : (
                <Tooltip title={record.motivo_anulacion}>
                  <Tag color="default">Anulado</Tag>
                </Tooltip>
              )
            }
          />
        )}
      </Table>

      <SectionDivider icon={<LinkOutlined />}>Aplicado a</SectionDivider>
      <Table
        dataSource={cobro?.aplicaciones}
        rowKey="id"
        pagination={false}
        size="small"
      >
        <Table.Column
          title="Factura"
          dataIndex="documento_venta_id"
          render={(
            _: CobroAplicacionRow["documento_venta_id"],
            record: CobroAplicacionRow
          ) => record.numero_factura ?? "—"}
        />
        <Table.Column
          title="Monto aplicado"
          dataIndex="monto_aplicado"
          align="right"
          render={(monto: CobroAplicacionRow["monto_aplicado"]) =>
            formatMonto(monto)
          }
        />
        {mostrarEstadoAplicaciones && (
          <Table.Column
            title="Estado"
            dataIndex="estado"
            render={(
              estadoAplicacion: CobroAplicacionRow["estado"],
              record: CobroAplicacionRow
            ) => (
              <Tooltip
                title={
                  record.valor_anulado_id
                    ? "Anulada por la anulación de un medio de cobro"
                    : undefined
                }
              >
                <Tag
                  color={estadoAplicacion === "ACTIVA" ? "green" : "default"}
                >
                  {estadoAplicacion === "ACTIVA" ? "Activa" : "Anulada"}
                </Tag>
              </Tooltip>
            )}
          />
        )}
      </Table>

      <Modal
        title="Anular cobro"
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
          <p>
            Los medios de cobro dejan de contar en sus fondos. La factura al
            inquilino sigue emitida y queda pendiente de cobro.
          </p>
          <Form.Item
            label="Motivo"
            name="motivo_anulacion"
            rules={[{ required: true }, { max: 255 }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
