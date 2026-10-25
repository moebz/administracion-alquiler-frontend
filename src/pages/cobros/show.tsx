import { useState } from "react";
import {
  FileTextOutlined,
  LinkOutlined,
  StopOutlined,
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
  // Valor que se anula con el modal; null si se anula el cobro entero.
  const [valorAAnular, setValorAAnular] = useState<CobroValorRow | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const abrirAnulacion = (valor: CobroValorRow | null) => {
    setValorAAnular(valor);
    setModalAbierto(true);
  };

  const anular = async (values: { motivo_anulacion: string }) => {
    if (!cobro) return;
    setGuardando(true);
    const url = valorAAnular
      ? `cobros/${cobro.id}/valores/${valorAAnular.id}/anular`
      : `cobros/${cobro.id}/anular`;
    const response = await kyInstance.patch(url, { json: values });
    setGuardando(false);

    // Cerrar el modal y recargar el cobro, que ya viene ANULADO o con el medio anulado.
    if (response.ok) {
      message.success(
        valorAAnular ? "Medio de cobro anulado." : "Cobro anulado."
      );
      setModalAbierto(false);
      query.refetch();
      return;
    }

    // Mostrar el motivo del rechazo (por ejemplo, el único medio de cobro activo).
    message.error(
      await extractErrorMessage(
        response,
        valorAAnular
          ? "No se pudo anular el medio de cobro."
          : "No se pudo anular el cobro."
      )
    );
  };

  // Mostrar el estado de medios y aplicaciones solo si alguno difiere del estado del cobro:
  // si todos coinciden, el Tag del encabezado ya lo dice.
  // Mostrarlo también si se puede anular algún medio, porque el botón va en esa columna.
  const cobroActivo = cobro?.estado === "ACTIVO";
  const valoresActivos =
    cobro?.valores.filter((valor) => valor.estado === "ACTIVO").length ?? 0;
  const puedeAnularValores = puedeAnular && cobroActivo;
  const mostrarEstadoValores =
    puedeAnularValores ||
    (cobro?.valores ?? []).some(
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
          <Button danger onClick={() => abrirAnulacion(null)}>
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
                <Space size={4} wrap>
                  <Tag color="green">Activo</Tag>
                  {puedeAnularValores && (
                    <Tooltip
                      title={
                        valoresActivos > 1
                          ? "Anular medio de cobro"
                          : "Es el único medio de cobro activo: anulá el cobro entero"
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
        title={valorAAnular ? "Anular medio de cobro" : "Anular cobro"}
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
          {valorAAnular ? (
            <p>
              {valorAAnular.medio_pago.nombre} por{" "}
              {formatMonto(valorAAnular.monto)}. Usalo solo si el dinero de este
              medio no entró o se cargó por error: deja de contar en su fondo y
              se anula lo aplicado a las facturas por ese importe, empezando por
              la última.
            </p>
          ) : (
            <p>
              Los medios de cobro dejan de contar en sus fondos. La factura al
              inquilino sigue emitida y queda pendiente de cobro.
            </p>
          )}
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
