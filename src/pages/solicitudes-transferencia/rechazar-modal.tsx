import { App, Form, Input, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { SolicitudTransferencia } from "./types";

type Props = {
  solicitud: SolicitudTransferencia;
  onClose: () => void;
  /** Se llama después de rechazar, para que la pantalla recargue sus solicitudes. */
  onRechazada: () => void;
};

// Rechaza la solicitud pendiente de un propietario con un motivo, que el propietario ve en su portal.
export const RechazarSolicitudModal = ({ solicitud, onClose, onRechazada }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ motivo_rechazo: string }>();

  const rechazar = async (valores: { motivo_rechazo: string }) => {
    const response = await kyInstance.patch(`solicitudes-transferencia/${solicitud.id}/rechazar`, { json: valores });

    // Avisar y recargar si se rechazó; si no, mostrar el mensaje del servidor (por ejemplo, que ya no estaba pendiente).
    if (response.ok) {
      message.success("Solicitud rechazada.");
      onRechazada();
      return;
    }

    message.error(await extractErrorMessage(response, "No se pudo rechazar la solicitud."));
  };

  return (
    <Modal
      open
      title={`Rechazar la solicitud de ${solicitud.propietario.nombre} por ${formatMonto(solicitud.monto)}`}
      okText="Rechazar"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={rechazar}>
        <Form.Item label="Motivo del rechazo" name="motivo_rechazo" rules={[{ required: true, message: "Ingresá un motivo" }]}>
          <Input.TextArea rows={3} maxLength={255} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
};
