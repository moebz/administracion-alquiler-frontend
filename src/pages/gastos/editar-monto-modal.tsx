import { useState } from "react";
import { Alert, App, Form, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { MontoInput } from "../../components/monto-input";
import { formatMonto } from "../../utils/monto";
import type { GastoRow } from "./types";

type Valores = { monto: number };

// Cambia el monto de un gasto APROBADO sin factura del proveedor, hasta lo aprobado y sin volver a pedir aprobación.
export const EditarMontoModal = ({
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
  const aprobado = Number(gasto.monto_aprobado ?? gasto.monto);

  const guardar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.patch(`gastos/${gasto.id}/monto`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Monto actualizado.");
      onSuccess();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo actualizar el monto."));
  };

  return (
    <Modal
      title="Editar monto"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={guardando}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Usalo cuando la factura del proveedor llega por menos de lo aprobado. Podés bajarlo y volver a subirlo hasta ${formatMonto(aprobado)} sin pedir aprobación otra vez.`}
      />
      <Form form={form} layout="vertical" onFinish={guardar} initialValues={{ monto: Number(gasto.monto) }}>
        <Form.Item
          label="Monto"
          name="monto"
          extra={`Aprobado: ${formatMonto(aprobado)}`}
          rules={[
            { required: true },
            {
              validator: async (_, monto: number | undefined) => {
                if (monto !== undefined && monto > aprobado) throw new Error(`No puede superar lo aprobado (${formatMonto(aprobado)}).`);
                if (monto !== undefined && monto <= 0) throw new Error("Tiene que ser mayor a 0.");
              },
            },
          ]}
        >
          <MontoInput min={1} max={aprobado} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
