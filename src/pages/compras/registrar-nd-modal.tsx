import { useState } from "react";
import { FileTextOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Alert, App, Col, DatePicker, Descriptions, Form, Input, Modal, Typography } from "antd";
import dayjs from "dayjs";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { totalesFactura } from "../../utils/factura";
import { formatMonto } from "../../utils/monto";
import { CARGO_DEUDOR_AL } from "../cargos/types";
import { LineasFormList, type LineaDocumento } from "../gastos/lineas-form-list";
import type { GastoRow } from "../gastos/types";
import type { CompraRow } from "./types";

type Valores = {
  timbrado_proveedor: string;
  numero: string;
  fecha: string;
  fecha_vencimiento?: string;
  fecha_vencimiento_cargo?: string;
  detalles: LineaDocumento[];
};

// Registra una ND del proveedor sobre la factura vigente del gasto: líneas libres, sin condición ni cuotas (una sola
// cuota por el total). El gasto sube sin nueva aprobación y cada línea crea un cargo nuevo, salvo que el gasto no genere.
export const RegistrarNdModal = ({
  gasto,
  compra,
  onClose,
  onSuccess,
}: {
  gasto: GastoRow;
  compra: CompraRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();
  const detalles = Form.useWatch("detalles", form) ?? [];
  const totales = totalesFactura(detalles);
  const previsto = gasto.cargo_previsto_nd;

  const registrar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post(`gastos/${gasto.id}/notas-debito`, {
      json: {
        ...values,
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        fecha_vencimiento: values.fecha_vencimiento ? dayjs(values.fecha_vencimiento).format("YYYY-MM-DD") : undefined,
        fecha_vencimiento_cargo: values.fecha_vencimiento_cargo
          ? dayjs(values.fecha_vencimiento_cargo).format("YYYY-MM-DD")
          : undefined,
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("ND registrada.");
      onSuccess();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({
          name: name.split(".").map((parte) => (/^\d+$/.test(parte) ? Number(parte) : parte)) as never,
          errors,
        })),
      );
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo registrar la ND."));
  };

  // Avisar qué pasa con los cargos: uno por línea, o ninguno si el gasto no genera o su contrato fue anulado.
  const avisoCargos = () => {
    if (previsto === null) return null;

    if (!previsto.crea) {
      return (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="El contrato de este gasto fue anulado: la ND se registra sin crear cargos"
          description="La diferencia queda como absorbida por la administradora."
        />
      );
    }

    return (
      <>
        {previsto.contrato_terminado && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`El contrato de este gasto terminó el ${dayjs(previsto.contrato_terminado).format("DD/MM/YYYY")}: los cargos se crean igual al inquilino de ese contrato. Si no corresponde, anulalos desde Cargos.`}
          />
        )}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Se crea un cargo ${CARGO_DEUDOR_AL[previsto.deudor]} ${previsto.deudor_nombre} por cada línea de la ND`}
          description="Los cargos que ya existen no cambian."
        />
        {previsto.deudor === "INQUILINO" && (
          <Form.Item
            label="Vencimiento de los cargos"
            name="fecha_vencimiento_cargo"
            extra="Sugerido: el próximo día de vencimiento del contrato, para cobrarlo junto con el alquiler."
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            style={{ maxWidth: 360 }}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabledDate={(fecha) => fecha.isBefore(dayjs(), "day")} />
          </Form.Item>
        )}
      </>
    );
  };

  return (
    <Modal
      title="Registrar ND del proveedor"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Registrar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      width={960}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Gasto">{gasto.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Proveedor">{gasto.proveedor.nombre}</Descriptions.Item>
        <Descriptions.Item label="Factura">{compra.numero}</Descriptions.Item>
        <Descriptions.Item label="Monto del gasto">{formatMonto(gasto.monto)}</Descriptions.Item>
      </Descriptions>

      <Form
        form={form}
        layout="vertical"
        onFinish={registrar}
        initialValues={{
          fecha: dayjs(),
          detalles: [{ descripcion: "", cantidad: 1, precio_unitario: undefined, tasa_iva: 10 }],
          fecha_vencimiento_cargo: previsto?.fecha_vencimiento ?? undefined,
        }}
      >
        {avisoCargos()}

        <SectionDivider icon={<FileTextOutlined />}>Datos de la ND</SectionDivider>
        <SectionRow gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item label="Número" name="numero" rules={[{ required: true }, { max: 20 }]}>
              <Input placeholder="001-001-0000001" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Timbrado" name="timbrado_proveedor" rules={[{ required: true }, { max: 20 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                // La ND no puede ser anterior a la factura que referencia.
                disabledDate={(fecha) => fecha.isBefore(dayjs(compra.fecha), "day")}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Vencimiento de la cuota"
              name="fecha_vencimiento"
              extra="Si no se elige, vence en la fecha de la ND."
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<UnorderedListOutlined />}>Detalle</SectionDivider>
        <LineasFormList detalles={detalles} />
        <Descriptions column={1} size="small" style={{ margin: "16px 0", maxWidth: 360, marginLeft: "auto" }}>
          <Descriptions.Item label="Total de la ND">
            <Typography.Text strong>{formatMonto(totales.total)}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Form>
    </Modal>
  );
};
