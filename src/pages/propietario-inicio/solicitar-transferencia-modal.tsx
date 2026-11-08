import { useEffect, useState } from "react";
import { Alert, App, Form, Modal, Select, Typography } from "antd";
import { MontoInput } from "../../components/monto-input";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { SolicitudTransferenciaNueva } from "../solicitudes-transferencia/types";

type Valores = { monto: number; persona_cuenta_id?: number };

type Props = {
  onClose: () => void;
  /** Se llama después de pedir, para que el inicio recargue su solicitud. */
  onSolicitada: () => void;
};

// Pide la plata desde el portal. Al abrir trae lo disponible (el tope), las cuentas activas y si ya hay una pendiente;
// el backend vuelve a validar todo, y un 422 se muestra como mensaje. Sin cuentas activas pide igual, sin cuenta.
export const SolicitarTransferenciaModal = ({ onClose, onSolicitada }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valores>();
  const [nueva, setNueva] = useState<SolicitudTransferenciaNueva>();
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  // Pedir al abrir el disponible y las cuentas, y precargar el monto y la cuenta si hay una sola.
  useEffect(() => {
    let vigente = true;
    kyInstance
      .get("propietario/solicitudes-transferencia/nueva")
      .json<SolicitudTransferenciaNueva>()
      .then((datos) => {
        if (!vigente) {
          return;
        }

        setNueva(datos);
        form.setFieldsValue({
          monto: Number(datos.disponible),
          persona_cuenta_id: datos.cuentas.length === 1 ? datos.cuentas[0].id : undefined,
        });
      })
      .catch((falla: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          setError(falla.message ?? "No se pudo cargar el pedido.");
        }
      });

    return () => {
      vigente = false;
    };
  }, [form]);

  const solicitar = async (valores: Valores) => {
    setGuardando(true);
    setError(undefined);
    const response = await kyInstance.post("propietario/solicitudes-transferencia", { json: valores });
    setGuardando(false);

    // Avisar y recargar el inicio si el pedido se creó.
    if (response.ok) {
      message.success("Pediste la transferencia. La administradora la va a atender.");
      onSolicitada();
      return;
    }

    // Mostrar el mensaje del servidor: superar el disponible o tener ya una pendiente se explican solos.
    setError(await extractErrorMessage(response, "No se pudo enviar la solicitud."));
  };

  const sinCuentas = nueva !== undefined && nueva.cuentas.length === 0;

  return (
    <Modal
      open
      title="Solicitar transferencia"
      okText="Solicitar"
      cancelText="Cancelar"
      okButtonProps={{ disabled: !nueva }}
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={solicitar}>
        <Form.Item
          label="Monto"
          name="monto"
          extra={nueva && <Typography.Text type="secondary">Disponible: {formatMonto(nueva.disponible)}</Typography.Text>}
          rules={[{ required: true, message: "Ingresá el monto" }]}
        >
          <MontoInput min={1} max={nueva ? Number(nueva.disponible) : undefined} />
        </Form.Item>

        {/* Con cuentas, elegir una; sin cuentas, avisar cómo se le paga. */}
        {sinCuentas ? (
          <Alert
            type="info"
            showIcon
            message="No tenés cuentas cargadas: se te va a pagar por cheque o como acuerdes con la administradora."
          />
        ) : (
          <Form.Item label="Cuenta" name="persona_cuenta_id" rules={[{ required: true, message: "Elegí la cuenta donde querés recibirla" }]}>
            <Select
              placeholder="Elegí una cuenta"
              options={(nueva?.cuentas ?? []).map((cuenta) => ({ value: cuenta.id, label: `${cuenta.banco} - ${cuenta.numero_cuenta}` }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
