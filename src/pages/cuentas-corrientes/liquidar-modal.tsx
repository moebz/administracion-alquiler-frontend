import { useCallback, useEffect, useState } from "react";
import { Alert, App, Descriptions, Modal } from "antd";
import dayjs from "dayjs";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { MontoCell, MovimientosTable } from "./movimientos-table";
import { PorDocumentarAlert } from "./por-documentar-alert";
import type { LiquidacionVistaPrevia } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

type Props = {
  propietarioId: number;
  /** Corte de la liquidación, YYYY-MM-DD. */
  corte: string;
  onClose: () => void;
  /** Se llama después de confirmar, para que la cuenta recargue sus movimientos y su historial. */
  onConfirmada: () => void;
};

// Muestra lo que tomaría la liquidación con ese corte y la confirma. Confirmar manda el total que vio el usuario:
// si cambió desde la vista previa el backend responde 422, y el modal vuelve a pedirla para que se revise de nuevo.
export const LiquidarModal = ({ propietarioId, corte, onClose, onConfirmada }: Props) => {
  const { message } = App.useApp();

  const [vistaPrevia, setVistaPrevia] = useState<LiquidacionVistaPrevia>();
  const [error, setError] = useState<string>();
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  const cargarVistaPrevia = useCallback(async () => {
    setCargando(true);
    setError(undefined);

    try {
      const previa = await kyInstance
        .get(`cuentas-corrientes/${propietarioId}/liquidacion-preview`, { searchParams: { corte } })
        .json<LiquidacionVistaPrevia>();
      setVistaPrevia(previa);
    } catch (falla) {
      // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
      setVistaPrevia(undefined);
      setError((falla as { message?: string }).message ?? "No se pudo calcular la liquidación.");
    } finally {
      setCargando(false);
    }
  }, [propietarioId, corte]);

  useEffect(() => {
    void cargarVistaPrevia();
  }, [cargarVistaPrevia]);

  const confirmar = async () => {
    if (!vistaPrevia) {
      return;
    }

    setConfirmando(true);
    const response = await kyInstance.post(`cuentas-corrientes/${propietarioId}/liquidaciones`, {
      json: { corte, total_esperado: vistaPrevia.total },
    });
    setConfirmando(false);

    if (response.ok) {
      message.success("Liquidación confirmada.");
      onConfirmada();
      return;
    }

    // Mostrar el motivo y volver a calcular, para que el usuario revise lo que cambió.
    message.error(await extractErrorMessage(response, "No se pudo confirmar la liquidación."));
    void cargarVistaPrevia();
  };

  return (
    <Modal
      open
      width={960}
      title="Liquidar al propietario"
      okText="Confirmar liquidación"
      cancelText="Cancelar"
      okButtonProps={{ disabled: !vistaPrevia || cargando }}
      confirmLoading={confirmando}
      onOk={confirmar}
      onCancel={onClose}
      destroyOnHidden
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {vistaPrevia && (
        <>
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Propietario">{vistaPrevia.propietario.nombre}</Descriptions.Item>
            <Descriptions.Item label="Corte">{dayjs(vistaPrevia.corte).format(FORMATO_FECHA)}</Descriptions.Item>
            <Descriptions.Item label="Saldo anterior">
              <MontoCell monto={vistaPrevia.saldo_anterior} />
            </Descriptions.Item>
            <Descriptions.Item label="Total de esta liquidación">
              <MontoCell monto={vistaPrevia.total} />
            </Descriptions.Item>
            <Descriptions.Item label="Saldo final">
              <MontoCell monto={vistaPrevia.saldo_final} />
            </Descriptions.Item>
          </Descriptions>
          {/* Avisar lo que le falta documentar al propietario con este corte; no impide liquidar. */}
          <PorDocumentarAlert porDocumentar={vistaPrevia.por_documentar} />
          <MovimientosTable movimientos={vistaPrevia.movimientos} loading={cargando} pageSize={10} />
        </>
      )}
    </Modal>
  );
};
