import { useState } from "react";
import { App, Form, Input, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import type { GastoRow } from "./types";

type Valores = { motivo_anulacion: string };

export const AnularGastoModal = ({
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

  const anular = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.patch(`gastos/${gasto.id}/anular`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Gasto anulado.");
      onSuccess();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular el gasto."));
  };

  return (
    <Modal
      title="Anular gasto"
      open
      onCancel={onClose}
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
  );
};
