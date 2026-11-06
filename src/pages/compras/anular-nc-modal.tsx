import { useState } from "react";
import { Alert, App, Form, Input, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { GastoRow } from "../gastos/types";
import type { CompraNotaAplicacionRow, CompraNotaRow } from "./types";

// Describe qué pasa con la factura al anular una aplicación: el pago en que se usó, si lo hubo, y lo que vuelve a quedar abierto.
const textoAplicacion = (aplicacion: CompraNotaAplicacionRow) => {
  const monto = formatMonto(aplicacion.monto_aplicado);
  if (aplicacion.pago_proveedor_numero !== null) {
    return `Se usaron ${monto} en el pago ${aplicacion.pago_proveedor_numero}: la factura ${aplicacion.documento_compra_numero} queda abierta por ${monto}.`;
  }
  return `Se aplicaron ${monto} a la cuota ${aplicacion.numero_cuota} de la factura ${aplicacion.documento_compra_numero}: queda abierta por ${monto}.`;
};

// Anula una NC del proveedor, sin plazo. Si ya se aplicó, lista las aplicaciones y pide confirmarlas: se anulan con la NC.
export const AnularNcModal = ({
  gasto,
  nota,
  puedeAnularPagos,
  onClose,
  onSuccess,
}: {
  gasto: GastoRow;
  nota: CompraNotaRow;
  // Anular aplicaciones activas pide además pagos.anular.
  puedeAnularPagos: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();
  const activas = nota.aplicaciones.filter((aplicacion) => aplicacion.estado === "ACTIVA");
  const faltaPermiso = activas.length > 0 && !puedeAnularPagos;

  const anular = async (values: { motivo_anulacion: string }) => {
    setGuardando(true);
    const response = await kyInstance.patch(`gastos/${gasto.id}/notas-credito/${nota.id}/anular`, {
      json: { ...values, confirmar_aplicaciones: activas.length > 0 },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("NC anulada.");
      onSuccess();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular la NC."));
  };

  return (
    <Modal
      title={`Anular NC ${nota.numero}`}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Anular"
      okButtonProps={{ danger: true, disabled: faltaPermiso }}
      cancelText="Cancelar"
      confirmLoading={guardando}
    >
      {activas.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Al anular la NC se anulan sus aplicaciones"
          description={activas.map((aplicacion) => (
            <div key={aplicacion.id}>{textoAplicacion(aplicacion)}</div>
          ))}
        />
      )}
      {faltaPermiso && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="No tenés permiso para anular las aplicaciones de la NC (pagos.anular)."
        />
      )}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="El monto del gasto vuelve al neto de la factura. Los cargos no cambian."
      />
      <Form form={form} layout="vertical" onFinish={anular}>
        <Form.Item label="Motivo" name="motivo_anulacion" rules={[{ required: true }, { max: 255 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
