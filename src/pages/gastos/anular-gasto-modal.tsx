import { useState } from "react";
import { Alert, App, Form, Input, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
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
  // Solo los cargos activos se anulan con el gasto.
  const cargosActivos = gasto.cargos.filter((cargo) => cargo.estado !== "ANULADO");
  const totalCargos = cargosActivos.reduce((total, cargo) => total + Number(cargo.monto), 0);

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
      {cargosActivos.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            cargosActivos.length === 1
              ? `También se anula el cargo al inquilino (${formatMonto(totalCargos)}).`
              : `También se anulan ${cargosActivos.length} cargos al inquilino por ${formatMonto(totalCargos)}.`
          }
        />
      )}
      <Form form={form} layout="vertical" onFinish={anular}>
        <Form.Item label="Motivo" name="motivo_anulacion" rules={[{ required: true }, { max: 255 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
