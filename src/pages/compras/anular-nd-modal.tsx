import { useState } from "react";
import { Alert, App, Form, Input, Modal } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import type { GastoRow } from "../gastos/types";
import type { CompraNotaRow } from "./types";

// Anula una ND del proveedor, sin plazo. Sus cargos no se tocan (como al anular la factura): quedan con la marca
// "Factura anulada" o "Revisar factura" y se resuelven desde cada cargo.
export const AnularNdModal = ({
  gasto,
  nota,
  onClose,
  onSuccess,
}: {
  gasto: GastoRow;
  nota: CompraNotaRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ motivo_anulacion: string }>();
  const hayPagos = nota.cuotas.some((cuota) => Number(cuota.saldo) < Number(cuota.monto));
  const cargosDeLaNd = gasto.cargos.filter(
    (cargo) => cargo.estado !== "ANULADO" && nota.detalles.some((detalle) => detalle.id === cargo.documento_compra_detalle_id),
  );

  const anular = async (values: { motivo_anulacion: string }) => {
    setGuardando(true);
    const response = await kyInstance.patch(`gastos/${gasto.id}/notas-debito/${nota.id}/anular`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("ND anulada.");
      onSuccess();
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo anular la ND."));
  };

  return (
    <Modal
      title={`Anular ND ${nota.numero}`}
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Anular"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      confirmLoading={guardando}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="El monto del gasto vuelve al neto de la factura."
        description={hayPagos ? "Lo pagado a la ND no se anula: queda como anticipo al proveedor." : undefined}
      />
      {cargosDeLaNd.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${cargosDeLaNd.length === 1 ? "El cargo de la ND queda" : `Los ${cargosDeLaNd.length} cargos de la ND quedan`} activo y marcado`}
          description='Los cargos no se anulan solos: quedan con la marca "Factura anulada" (sin facturar) o "Revisar factura" (facturado). Resolvelos con "Anular" o "Corregir monto" desde el cargo.'
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
