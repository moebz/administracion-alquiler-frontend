import { useState } from "react";
import { App, Form, Input, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";

// Anula un uso del saldo a favor de una NC del proveedor: el pago y su efectivo no cambian,
// la cuota vuelve a quedar abierta y el saldo vuelve a la NC.
export const AnularAplicacionNcModal = ({
  aplicacionId,
  descripcion,
  onClose,
  onSuccess,
}: {
  aplicacionId: number;
  // Qué se anula, para que quien confirma vea el efecto (ej. "100.000 de la NC 001-001-0000100 en la factura 001-001-0000002").
  descripcion: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();

  const anular = async (values: { motivo_anulacion: string }) => {
    setGuardando(true);
    const response = await kyInstance.patch(`nc-compra-aplicaciones/${aplicacionId}/anular`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Aplicación anulada.");
      onSuccess();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular la aplicación."));
  };

  return (
    <Modal
      title="Anular aplicación de la NC"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Anular"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      confirmLoading={guardando}
    >
      <p>
        {descripcion}. El saldo vuelve a la NC y la cuota queda abierta; el pago y su efectivo no cambian.
      </p>
      <Form form={form} layout="vertical" onFinish={anular}>
        <Form.Item label="Motivo" name="motivo_anulacion" rules={[{ required: true }, { max: 255 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
