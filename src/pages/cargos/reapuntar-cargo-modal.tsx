import { useState } from "react";
import { usePermissions } from "@refinedev/core";
import { Alert, App, Button, Descriptions, Modal, Select } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { puedeCorregirMonto } from "./correccion";
import { CorregirMontoModal } from "./corregir-monto-modal";
import { accionSugeridaTexto, type AccionSugerida, type CargoDeudor, type CargoRow } from "./types";

type CargoReapuntable = Pick<CargoRow, "tipo" | "estado"> & {
  id: number;
  descripcion: string;
  deudor: CargoDeudor;
  tasa_iva: number;
  monto: number | string;
  monto_vigente: number | string;
  accion_sugerida: AccionSugerida | null;
};

// Reapunta un cargo marcado "Revisar factura" a una línea de la factura vigente del proveedor. El monto del cargo no cambia:
// si la línea es mayor que su monto vigente, la diferencia nace como ajuste a cobrar; si es menor, primero se corrige el monto.
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
  const { data: permissions } = usePermissions<string[]>({});
  const accion = cargo.accion_sugerida;
  const candidatas = accion?.candidatas ?? [];
  const montoVigente = Number(cargo.monto_vigente);
  // Precargar la línea si hay una sola candidata.
  const [lineaId, setLineaId] = useState<number | undefined>(candidatas.length === 1 ? candidatas[0].id : undefined);
  const [guardando, setGuardando] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const linea = candidatas.find((candidata) => candidata.id === lineaId);
  const subtotal = Number(linea?.subtotal ?? 0);
  // Una línea menor que el monto vigente no se puede usar: primero hay que corregir el monto.
  const menorQueVigente = linea !== undefined && subtotal < montoVigente;

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
      okButtonProps={{ disabled: !linea || menorQueVigente }}
    >
      {accion && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message={accionSugeridaTexto(accion, cargo.deudor, cargo.tasa_iva)} />
      )}
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Cargo">{cargo.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Monto vigente">{formatMonto(montoVigente)}</Descriptions.Item>
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
      {linea && !menorQueVigente && (
        <Descriptions column={2} size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Subtotal de la línea">{formatMonto(subtotal)}</Descriptions.Item>
          <Descriptions.Item label="Ajuste a cobrar">{subtotal > montoVigente ? formatMonto(subtotal - montoVigente) : "—"}</Descriptions.Item>
        </Descriptions>
      )}
      {menorQueVigente && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 16 }}
          message={`La línea es menor que el monto vigente: corregí el monto a ${formatMonto(subtotal)} y reapuntá.`}
          action={
            puedeCorregirMonto(cargo, permissions) && (
              <Button size="small" onClick={() => setCorrigiendo(true)}>
                Corregir monto
              </Button>
            )
          }
        />
      )}
      {corrigiendo && (
        <CorregirMontoModal
          cargo={cargo}
          // Cerrar también este modal al corregir: la acción sugerida cambia con el monto y hay que volver a abrirlo.
          onClose={() => setCorrigiendo(false)}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
};
