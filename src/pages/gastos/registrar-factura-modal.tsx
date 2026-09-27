import { useState } from "react";
import { App, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { COMPRA_CONDICION_OPTIONS, type CompraCondicion } from "../compras/types";
import type { GastoRow } from "./types";

const TASA_IVA_OPTIONS = [
  { label: "0% (exenta)", value: 0 },
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
];

type Valores = {
  timbrado_proveedor: string;
  numero: string;
  fecha: string;
  condicion: CompraCondicion;
  tasa_iva: number;
  cantidad_cuotas?: number;
  fecha_primer_vencimiento?: string;
};

export const RegistrarFacturaModal = ({
  gasto,
  onClose,
  onSuccess,
}: {
  gasto: GastoRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();
  const condicion = Form.useWatch("condicion", form);

  const registrar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post(`gastos/${gasto.id}/factura`, {
      json: {
        ...values,
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        fecha_primer_vencimiento: values.condicion === "CREDITO" && values.fecha_primer_vencimiento
          ? dayjs(values.fecha_primer_vencimiento).format("YYYY-MM-DD")
          : undefined,
      },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("Factura registrada.");
      onSuccess();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({ name: name as keyof Valores, errors })),
      );
      return;
    }
    message.error(body?.message ?? "No se pudo registrar la factura.");
  };

  return (
    <Modal
      title="Registrar factura del proveedor"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Registrar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      width={640}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Gasto">{gasto.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Proveedor">{gasto.proveedor.nombre}</Descriptions.Item>
        <Descriptions.Item label="Monto">{formatMonto(gasto.monto)}</Descriptions.Item>
      </Descriptions>
      <Form form={form} layout="vertical" onFinish={registrar} initialValues={{ condicion: "CONTADO", tasa_iva: 10 }}>
        <Form.Item label="Timbrado del proveedor" name="timbrado_proveedor" rules={[{ required: true }, { max: 20 }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Número de factura" name="numero" rules={[{ required: true }, { max: 20 }]}>
          <Input placeholder="001-001-0000001" />
        </Form.Item>
        <Form.Item
          label="Fecha"
          name="fecha"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item label="Tasa de IVA" name="tasa_iva" rules={[{ required: true }]}>
          <Select options={TASA_IVA_OPTIONS} />
        </Form.Item>
        <Form.Item label="Condición" name="condicion" rules={[{ required: true }]}>
          <Select options={COMPRA_CONDICION_OPTIONS} />
        </Form.Item>

        {condicion === "CREDITO" && (
          <>
            <Form.Item label="Cantidad de cuotas" name="cantidad_cuotas" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={1} precision={0} />
            </Form.Item>
            <Form.Item
              label="Fecha del primer vencimiento"
              name="fecha_primer_vencimiento"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
