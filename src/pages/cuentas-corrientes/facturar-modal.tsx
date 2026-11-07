import { useState } from "react";
import { App, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { FacturarFields } from "./facturar-fields";
import type { FacturarSeleccion } from "./types";

type Props = {
  propietarioId: number;
  onClose: () => void;
  /** Se llama después de facturar, para que la cuenta recargue sus facturas. */
  onFacturada: () => void;
};

// Factura al propietario lo que falta hasta un período: una sola factura a crédito con el reintegro y la comisión,
// y las NC de comisión que sobran. Facturar no cambia el saldo de la cuenta corriente.
export const FacturarModal = ({ propietarioId, onClose, onFacturada }: Props) => {
  const { message } = App.useApp();
  const [seleccion, setSeleccion] = useState<FacturarSeleccion>();
  const [guardando, setGuardando] = useState(false);

  const facturar = async () => {
    if (!seleccion) {
      return;
    }

    setGuardando(true);
    const response = await kyInstance.post(`cuentas-corrientes/${propietarioId}/facturar`, { json: seleccion });
    setGuardando(false);

    if (response.ok) {
      message.success("Facturación al propietario registrada.");
      onFacturada();
      return;
    }

    message.error(await extractErrorMessage(response, "No se pudo facturar al propietario."));
  };

  return (
    <Modal
      open
      width={720}
      title="Facturar al propietario"
      okText="Facturar"
      cancelText="Cancelar"
      okButtonProps={{ disabled: !seleccion }}
      confirmLoading={guardando}
      onOk={facturar}
      onCancel={onClose}
      destroyOnHidden
    >
      <FacturarFields propietarioId={propietarioId} onChange={setSeleccion} />
    </Modal>
  );
};
