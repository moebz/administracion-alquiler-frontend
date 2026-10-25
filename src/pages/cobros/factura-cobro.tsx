import { useState } from "react";
import { FileDoneOutlined } from "@ant-design/icons";
import { usePermissions } from "@refinedev/core";
import {
  App,
  Button,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { SectionDivider } from "../../components/section-divider";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { CobroFacturaDetalleRow, CobroFacturaRow } from "./types";

// Líneas de totales de la factura, en el orden en que se leen en una factura impresa.
const TOTALES_FACTURA: {
  label: string;
  key: "exentas" | "gravadas_5" | "iva_5" | "gravadas_10" | "iva_10";
}[] = [
  { label: "Exentas", key: "exentas" },
  { label: "Gravadas 5%", key: "gravadas_5" },
  { label: "IVA 5%", key: "iva_5" },
  { label: "Gravadas 10%", key: "gravadas_10" },
  { label: "IVA 10%", key: "iva_10" },
];

const PERMISO_ANULAR = "facturas.anular";

type FacturaCobroProps = {
  factura: CobroFacturaRow;
  // Se llama al anular la factura, para recargar el cobro.
  onAnulada: () => void;
};

// Una factura al inquilino a la que se aplica el cobro: la que emitió este cobro o una que ya estaba
// abierta (por ejemplo, la de un cobro anulado) y este cobro saldó.
export const FacturaCobro = ({ factura, onAnulada }: FacturaCobroProps) => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeAnular = permissions?.includes(PERMISO_ANULAR) ?? false;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    setGuardando(true);
    const response = await kyInstance.patch(
      `facturas-venta/${factura.id}/anular`,
      { json: values }
    );
    setGuardando(false);

    // Cerrar el modal y recargar el cobro, con la factura ya ANULADO.
    if (response.ok) {
      message.success("Factura anulada.");
      setModalAbierto(false);
      onAnulada();
      return;
    }

    // Mostrar el motivo del rechazo (cobro aplicado, plazo vencido).
    message.error(
      await extractErrorMessage(response, "No se pudo anular la factura.")
    );
  };

  return (
    <>
      <SectionDivider icon={<FileDoneOutlined />}>
        {factura.emitida_por_este_cobro ? "Factura emitida" : "Factura cobrada"}
      </SectionDivider>
      {/* Ofrecer anular solo una factura emitida; deshabilitado, el tooltip explica por qué todavía no se puede. */}
      {puedeAnular && factura.estado === "EMITIDO" && (
        <Flex justify="flex-end" style={{ marginBottom: 8 }}>
          <Tooltip title={factura.motivo_no_anulable}>
            <Button
              danger
              size="small"
              disabled={factura.motivo_no_anulable !== null}
              onClick={() => setModalAbierto(true)}
            >
              Anular factura
            </Button>
          </Tooltip>
        </Flex>
      )}
      <Descriptions
        column={{ xs: 1, md: 2, xl: 3 }}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Número">
          {factura.numero ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {dayjs(factura.fecha).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Condición">Contado</Descriptions.Item>
        <Descriptions.Item label="Estado">
          {factura.estado === "ANULADO" ? (
            <Tag color="default">Anulada</Tag>
          ) : (
            <Tag color="green">Emitida</Tag>
          )}
        </Descriptions.Item>
        {/* Mostrar el saldo solo si la factura sigue debiendo algo (por ejemplo, con este cobro anulado). */}
        {factura.estado === "EMITIDO" && Number(factura.saldo) > 0 && (
          <Descriptions.Item label="Saldo pendiente">
            {formatMonto(factura.saldo)}
          </Descriptions.Item>
        )}
        {factura.estado === "ANULADO" && (
          <Descriptions.Item label="Motivo de anulación">
            {factura.motivo_anulacion}
          </Descriptions.Item>
        )}
      </Descriptions>
      <Table
        dataSource={factura.detalles}
        rowKey="id"
        pagination={false}
        size="small"
        summary={() => (
          <Table.Summary>
            {TOTALES_FACTURA.filter(
              ({ key }) => Number(factura[key]) !== 0
            ).map(({ label, key }) => (
              <Table.Summary.Row key={key}>
                <Table.Summary.Cell index={0} colSpan={2} align="right">
                  <Typography.Text type="secondary">{label}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {formatMonto(factura[key])}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            ))}
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2} align="right">
                <Typography.Text strong>Total</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Typography.Text strong>
                  {formatMonto(factura.total)}
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      >
        <Table.Column
          title="Descripción"
          dataIndex="descripcion"
          render={(
            descripcion: CobroFacturaDetalleRow["descripcion"],
            record: CobroFacturaDetalleRow
          ) =>
            record.cargo_id ? (
              <Tooltip title="Ver cargo">
                <Link
                  to={`/administrador/cargos?cargo_id=${record.cargo_id}&todos_los_estados=1`}
                >
                  {descripcion}
                </Link>
              </Tooltip>
            ) : (
              descripcion
            )
          }
        />
        <Table.Column
          title="IVA"
          dataIndex="tasa_iva"
          render={(tasa: CobroFacturaDetalleRow["tasa_iva"]) =>
            tasa === 0 ? "Exenta" : `${tasa}%`
          }
        />
        <Table.Column
          title="Subtotal"
          dataIndex="subtotal"
          align="right"
          render={(subtotal: CobroFacturaDetalleRow["subtotal"]) =>
            formatMonto(subtotal)
          }
        />
      </Table>
      <Modal
        title={`Anular factura ${factura.numero ?? ""}`}
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
            Sus cargos vuelven a quedar pendientes de facturar y el número queda
            usado en el timbrado.
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
    </>
  );
};
