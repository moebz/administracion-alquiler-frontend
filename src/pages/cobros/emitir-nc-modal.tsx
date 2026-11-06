import { useState } from "react";
import { UnorderedListOutlined } from "@ant-design/icons";
import { Alert, App, Button, Descriptions, Form, Input, Modal, Table, Tag } from "antd";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { repartirNotaCredito } from "./nota-credito";
import type { CobroFacturaDetalleRow, CobroFacturaRow } from "./types";

type Valores = {
  motivo: string;
  // Importe de la NC por cargo, indexado por el id del cargo de la línea.
  importes: Record<number, number>;
};

// Emite una NC sobre una factura al inquilino: una línea por cada cargo de la factura que se corrige, hasta lo que queda
// vigente de su línea. Se aplica sola a la cuota de la factura y el resto queda a favor del inquilino.
export const EmitirNcModal = ({
  factura,
  onClose,
  onSuccess,
}: {
  factura: CobroFacturaRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();

  // Ofrecer solo las líneas con cargo: son las únicas que se acreditan.
  const lineas = factura.detalles.filter((detalle) => detalle.cargo_id !== null);

  const importes = Form.useWatch("importes", form) as Record<number, number> | undefined;
  const totalNc = Object.values(importes ?? {}).reduce((acum, importe) => acum + (Number(importe) || 0), 0);
  const { aplicado, aFavor } = repartirNotaCredito(totalNc, Number(factura.saldo));

  const emitir = async (values: Valores) => {
    const lineasNc = lineas
      .map((detalle) => ({ cargo_id: detalle.cargo_id, monto: Number(values.importes?.[detalle.cargo_id as number]) || 0 }))
      .filter((linea) => linea.monto > 0);

    if (lineasNc.length === 0) {
      message.error("Indicá el importe de la NC en al menos una línea.");
      return;
    }

    setGuardando(true);
    const response = await kyInstance.post(`facturas-venta/${factura.id}/notas-credito`, {
      json: { motivo: values.motivo, lineas: lineasNc },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("NC emitida.");
      onSuccess();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      // Mostrar bajo su campo el error del motivo, y como mensaje los de las líneas (la tabla no tiene campo por línea).
      const deLineas = Object.entries(body.errors).filter(([name]) => name.startsWith("lineas"));
      form.setFields(
        Object.entries(body.errors)
          .filter(([name]) => !name.startsWith("lineas"))
          .map(([name, errors]) => ({ name: name.split("."), errors })) as Parameters<typeof form.setFields>[0],
      );
      if (deLineas.length > 0) message.error(deLineas.map(([, errors]) => errors.join(" ")).join(" "));
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo emitir la NC."));
  };

  return (
    <Modal
      title={`Emitir NC sobre la factura ${factura.numero ?? ""}`}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Emitir"
      cancelText="Cancelar"
      confirmLoading={guardando}
      width={760}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Factura">{factura.numero ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Total">{formatMonto(factura.total)}</Descriptions.Item>
        <Descriptions.Item label="Saldo pendiente">{formatMonto(factura.saldo)}</Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical" onFinish={emitir}>
        <Form.Item label="Motivo" name="motivo" rules={[{ required: true }, { max: 255 }]}>
          <Input placeholder="Ej.: expensa de agosto corregida" />
        </Form.Item>

        <SectionDivider icon={<UnorderedListOutlined />}>Líneas que corrige</SectionDivider>
        <Table<CobroFacturaDetalleRow> dataSource={lineas} rowKey="id" pagination={false} size="small">
          <Table.Column title="Descripción" dataIndex="descripcion" />
          <Table.Column
            title="IVA"
            dataIndex="tasa_iva"
            render={(tasa: CobroFacturaDetalleRow["tasa_iva"]) => <Tag bordered={false}>{tasa === 0 ? "Exenta" : `${tasa}%`}</Tag>}
          />
          <Table.Column
            title="Tope"
            dataIndex="tope_nc"
            align="right"
            render={(tope: CobroFacturaDetalleRow["tope_nc"]) => formatMonto(tope ?? 0)}
          />
          <Table.Column
            title="Importe de la NC"
            key="importe"
            width={240}
            render={(_, detalle: CobroFacturaDetalleRow) => (
              <Form.Item name={["importes", detalle.cargo_id as number]} noStyle initialValue={0}>
                <MontoInput max={Number(detalle.tope_nc ?? 0)} addonAfter={null} />
              </Form.Item>
            )}
          />
          <Table.Column
            title=""
            key="todo"
            width={70}
            render={(_, detalle: CobroFacturaDetalleRow) => (
              <Button
                size="small"
                disabled={Number(detalle.tope_nc ?? 0) <= 0}
                onClick={() => form.setFieldValue(["importes", detalle.cargo_id as number], Number(detalle.tope_nc))}
              >
                Todo
              </Button>
            )}
          />
        </Table>

        {/* Mostrar antes de confirmar cómo se aplica la NC: a la cuota de la factura y, si sobra, a favor del inquilino. */}
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message={`Se aplican ${formatMonto(aplicado)} a la cuota de esta factura y quedan ${formatMonto(aFavor)} a favor del inquilino.`}
          description="El monto de cada cargo baja por el importe de su línea."
        />
      </Form>
    </Modal>
  );
};
