import { useState } from "react";
import { App, DatePicker, Form, Modal } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";

type Valores = { hasta_periodo: Dayjs };

export const GenerarCargosModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();

  const generar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post("cargos/generar", {
      json: { hasta_periodo: values.hasta_periodo.format("YYYY-MM") },
    });
    setGuardando(false);

    if (!response.ok) {
      message.error(await extractErrorMessage(response, "No se pudieron generar los cargos."));
      return;
    }

    const { cargos_generados: generados } = (await response.json()) as { cargos_generados: number };
    message.success(
      generados === 0
        ? "No había cargos nuevos para generar."
        : `Se ${generados === 1 ? "generó 1 cargo" : `generaron ${generados} cargos`}.`,
    );
    onSuccess();
  };

  return (
    <Modal
      title="Generar cargos"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Generar"
      cancelText="Cancelar"
      confirmLoading={guardando}
    >
      <Form form={form} layout="vertical" onFinish={generar} initialValues={{ hasta_periodo: dayjs() }}>
        <Form.Item
          label="Generar hasta el período"
          name="hasta_periodo"
          rules={[{ required: true }]}
          extra="Crea el alquiler de todos los contratos hasta ese mes inclusive, sin repetir los que ya existen. Elegí un mes posterior para adelantar cargos."
        >
          <DatePicker picker="month" format="MM/YYYY" allowClear={false} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
