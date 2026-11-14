import { useState } from "react";
import { ContainerOutlined, FilePdfOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Alert, App, Button, Descriptions, Tag } from "antd";
import dayjs from "dayjs";
import { PageTitle } from "../../components/page-title";
import { descargarPdfDeRendicion } from "../../utils/descargar";
import { MontoCell, MovimientosTable } from "../cuentas-corrientes/movimientos-table";
import { RENDICION_ESTADO_LABEL, type RendicionDetalle } from "../cuentas-corrientes/types";

const FORMATO_FECHA = "DD/MM/YYYY";

// Sin entrada en el menú: se llega desde la cuenta corriente del propietario, por el historial o por la columna
// "Rendición" de sus movimientos. Se ve en pantalla y, si está confirmada, se descarga en PDF.
// Lo usa también el portal del propietario, con `prefijoPdf="propietario/"` para pedir el PDF de su propia ruta.
export const RendicionShow = ({ prefijoPdf = "" }: { prefijoPdf?: string }) => {
  const { message } = App.useApp();
  const { query, result: rendicion } = useShow<RendicionDetalle>();
  const anulada = rendicion?.estado === "ANULADA";
  const [descargando, setDescargando] = useState(false);

  // Descargar el PDF de la rendición, o mostrar por qué no se pudo.
  const descargarPdf = async () => {
    if (!rendicion) {
      return;
    }

    setDescargando(true);
    try {
      await descargarPdfDeRendicion(rendicion.id, rendicion.corte, prefijoPdf);
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Show
      isLoading={query.isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          {rendicion && !anulada && (
            <Button icon={<FilePdfOutlined />} loading={descargando} onClick={descargarPdf}>
              Descargar PDF
            </Button>
          )}
        </>
      )}
      title={<PageTitle icon={<ContainerOutlined />}>{rendicion ? `Rendición N.º ${rendicion.id}` : "Rendición"}</PageTitle>}
    >
      {rendicion && (
        <>
          {anulada && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Anulada${rendicion.fecha_anulacion ? ` el ${dayjs(rendicion.fecha_anulacion).format(FORMATO_FECHA)}` : ""}: ${rendicion.motivo_anulacion ?? ""}`}
              description="Sus movimientos volvieron a quedar sin rendir; los totales son los que tenía cuando se confirmó."
            />
          )}
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Propietario">{rendicion.propietario.nombre}</Descriptions.Item>
            <Descriptions.Item label="Documento">{rendicion.propietario.documento}</Descriptions.Item>
            <Descriptions.Item label="Corte">{dayjs(rendicion.corte).format(FORMATO_FECHA)}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={anulada ? "default" : "green"}>{RENDICION_ESTADO_LABEL[rendicion.estado]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Saldo anterior">
              <MontoCell monto={rendicion.saldo_anterior} />
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              <MontoCell monto={rendicion.total} />
            </Descriptions.Item>
            <Descriptions.Item label="Saldo final">
              <MontoCell monto={rendicion.saldo_final} />
            </Descriptions.Item>
          </Descriptions>
          {!anulada && <MovimientosTable movimientos={rendicion.movimientos} />}
        </>
      )}
    </Show>
  );
};
