import { useCallback, useEffect, useState } from "react";
import { Alert, App, Descriptions, Modal } from "antd";
import dayjs from "dayjs";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { ControlDocumentosAlert } from "./control-documentos-alert";
import { MontoCell, MovimientosTable } from "./movimientos-table";
import { PorDocumentarAlert } from "./por-documentar-alert";
import type { RendicionVistaPrevia } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

type Props = {
  propietarioId: number;
  /** Corte de la rendición, YYYY-MM-DD. */
  corte: string;
  onClose: () => void;
  /** Se llama después de confirmar, para que la cuenta recargue sus movimientos y su historial. */
  onConfirmada: () => void;
};

// Muestra lo que tomaría la rendición con ese corte y la confirma. Confirmar manda el total que vio el usuario:
// si cambió desde la vista previa el backend responde 422, y el modal vuelve a pedirla para que se revise de nuevo.
export const RendirModal = ({ propietarioId, corte, onClose, onConfirmada }: Props) => {
  const { message } = App.useApp();

  const [vistaPrevia, setVistaPrevia] = useState<RendicionVistaPrevia>();
  const [error, setError] = useState<string>();
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  const cargarVistaPrevia = useCallback(async () => {
    setCargando(true);
    setError(undefined);

    try {
      const previa = await kyInstance
        .get(`cuentas-corrientes/${propietarioId}/rendicion-preview`, { searchParams: { corte } })
        .json<RendicionVistaPrevia>();
      setVistaPrevia(previa);
    } catch (falla) {
      // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
      setVistaPrevia(undefined);
      setError((falla as { message?: string }).message ?? "No se pudo calcular la rendición.");
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
    const response = await kyInstance.post(`cuentas-corrientes/${propietarioId}/rendiciones`, {
      json: { corte, total_esperado: vistaPrevia.total },
    });
    setConfirmando(false);

    if (response.ok) {
      message.success("Rendición confirmada.");
      onConfirmada();
      return;
    }

    // Mostrar el motivo y volver a calcular, para que el usuario revise lo que cambió.
    message.error(await extractErrorMessage(response, "No se pudo confirmar la rendición."));
    void cargarVistaPrevia();
  };

  return (
    <Modal
      open
      width={960}
      title="Rendir al propietario"
      okText="Confirmar rendición"
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
            <Descriptions.Item label="Total de esta rendición">
              <MontoCell monto={vistaPrevia.total} />
            </Descriptions.Item>
            <Descriptions.Item label="Saldo final">
              <MontoCell monto={vistaPrevia.saldo_final} />
            </Descriptions.Item>
          </Descriptions>
          {/* Avisar lo que le falta documentar al propietario con este corte; no impide rendir. */}
          <PorDocumentarAlert porDocumentar={vistaPrevia.por_documentar} />
          {/* Avisar si el saldo de la cuenta y los papeles del propietario coinciden; no impide rendir. */}
          <ControlDocumentosAlert control={vistaPrevia.control} />
          <MovimientosTable movimientos={vistaPrevia.movimientos} loading={cargando} pageSize={10} />
        </>
      )}
    </Modal>
  );
};
