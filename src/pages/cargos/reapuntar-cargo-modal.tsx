import { useState } from "react";
import { Alert, App, Descriptions, Modal, Select } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { accionSugeridaTexto, type AccionSugerida, type CargoDeudor } from "./types";

type CargoReapuntable = {
  id: number;
  descripcion: string;
  deudor: CargoDeudor;
  tasa_iva: number;
  monto: number | string;
  accion_sugerida: AccionSugerida | null;
};

// Reapunta un cargo marcado "Revisar factura" a una línea de la factura vigente del proveedor: toma su subtotal como monto.
export const ReapuntarCargoModal = ({
  cargo,
  onClose,
  onSuccess,
}: {
  cargo: CargoReapuntable;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const accion = cargo.accion_sugerida;
  const candidatas = accion?.candidatas ?? [];
  const facturado = Number(accion?.facturado ?? 0);
  // Precargar la línea si hay una sola candidata.
  const [lineaId, setLineaId] = useState<number | undefined>(candidatas.length === 1 ? candidatas[0].id : undefined);
  const [guardando, setGuardando] = useState(false);
  const linea = candidatas.find((candidata) => candidata.id === lineaId);
  const subtotal = Number(linea?.subtotal ?? 0);
  // Una línea menor que lo facturado no se puede usar: primero hay que acreditar la diferencia.
  const menorQueFacturado = linea !== undefined && subtotal < facturado;

  const reapuntar = async () => {
    setGuardando(true);
    const response = await kyInstance.patch(`cargos/${cargo.id}/reapuntar`, { json: { linea_id: lineaId } });
    setGuardando(false);

    if (!response.ok) {
      message.error(await extractErrorMessage(response, "No se pudo reapuntar el cargo."));
      return;
    }

    message.success("Cargo reapuntado.");
    onSuccess();
  };

  return (
    <Modal
      title="Reapuntar cargo"
      open
      onCancel={onClose}
      onOk={reapuntar}
      okText="Reapuntar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      okButtonProps={{ disabled: !linea || menorQueFacturado }}
    >
      {accion && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message={accionSugeridaTexto(accion, cargo.deudor, cargo.tasa_iva)} />
      )}
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Cargo">{cargo.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Facturado">{formatMonto(facturado)}</Descriptions.Item>
      </Descriptions>
      <Select
        style={{ width: "100%" }}
        placeholder="Línea de la factura del proveedor"
        value={lineaId}
        onChange={setLineaId}
        options={candidatas.map((candidata) => ({
          value: candidata.id,
          label: `${candidata.descripcion} · ${formatMonto(candidata.subtotal)}`,
        }))}
      />
      {linea && !menorQueFacturado && (
        <Descriptions column={2} size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Monto nuevo">{formatMonto(subtotal)}</Descriptions.Item>
          <Descriptions.Item label="Diferencia a cobrar">{formatMonto(subtotal - facturado)}</Descriptions.Item>
        </Descriptions>
      )}
      {menorQueFacturado && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 16 }}
          message={`La línea es menor que lo facturado: primero emití una NC por ${formatMonto(facturado - subtotal)} o anulá la factura.`}
        />
      )}
    </Modal>
  );
};
