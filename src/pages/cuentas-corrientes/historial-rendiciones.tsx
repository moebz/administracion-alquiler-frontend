import { useEffect, useState } from "react";
import { App, Button, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import { EyeOutlined, FilePdfOutlined, StopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { descargarPdfDeRendicion } from "../../utils/descargar";
import { MontoCell } from "./movimientos-table";
import { RENDICION_ESTADO_LABEL, type RendicionHistorialRow } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

type Props = {
  propietarioId: number;
  puedeAnular: boolean;
  /** Cambia cuando la cuenta confirmó o anuló una rendición, para volver a pedir el historial. */
  version: number;
  /** Se llama después de anular, para que la cuenta recargue sus movimientos. */
  onAnulada: () => void;
};

// Historial de rendiciones del propietario, de la más nueva a la más vieja. Solo la última confirmada se puede anular.
export const HistorialRendiciones = ({ propietarioId, puedeAnular, version, onAnulada }: Props) => {
  const { message, modal } = App.useApp();

  const [filas, setFilas] = useState<RendicionHistorialRow[]>();
  const [cargando, setCargando] = useState(true);
  const [descargandoId, setDescargandoId] = useState<number>();

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/rendiciones`)
      .json<RendicionHistorialRow[]>()
      .then((datos) => vigente && setFilas(datos))
      .catch((error: { message?: string }) => {
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar el historial de rendiciones.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, version, message]);

  // Descargar el PDF de la rendición, o mostrar por qué no se pudo.
  const descargarPdf = async (rendicion: RendicionHistorialRow) => {
    setDescargandoId(rendicion.id);
    try {
      await descargarPdfDeRendicion(rendicion.id, rendicion.corte);
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargandoId(undefined);
    }
  };

  const anular = (rendicion: RendicionHistorialRow) => {
    let motivo = "";

    modal.confirm({
      title: "¿Anular esta rendición?",
      content: (
        <>
          <Typography.Paragraph>
            Sus movimientos vuelven a quedar sin rendir y los toma la próxima rendición.
          </Typography.Paragraph>
          <Input.TextArea
            rows={3}
            maxLength={255}
            placeholder="Motivo de la anulación"
            onChange={(event) => {
              motivo = event.target.value;
            }}
          />
        </>
      ),
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        if (!motivo.trim()) {
          message.error("Ingresá el motivo de la anulación.");
          throw new Error("motivo requerido");
        }

        const response = await kyInstance.patch(`rendiciones/${rendicion.id}/anular`, { json: { motivo_anulacion: motivo } });
        if (!response.ok) {
          message.error(await extractErrorMessage(response, "No se pudo anular la rendición."));
          throw new Error("anulación rechazada");
        }

        message.success("Rendición anulada.");
        onAnulada();
      },
    });
  };

  return (
    <Table<RendicionHistorialRow>
      title={() => <Typography.Text strong>Rendiciones</Typography.Text>}
      dataSource={filas}
      loading={cargando}
      rowKey="id"
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "Todavía no se le rindió nada." }}
    >
      <Table.Column title="N.º" dataIndex="id" />
      <Table.Column title="Corte" dataIndex="corte" render={(corte: string) => dayjs(corte).format(FORMATO_FECHA)} />
      <Table.Column title="Saldo anterior" dataIndex="saldo_anterior" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column title="Saldo final" dataIndex="saldo_final" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column
        title="Estado"
        dataIndex="estado"
        render={(estado: RendicionHistorialRow["estado"], rendicion: RendicionHistorialRow) => (
          <Space size={4} wrap>
            <Tag color={estado === "CONFIRMADA" ? "green" : "default"}>{RENDICION_ESTADO_LABEL[estado]}</Tag>
            <Tooltip title="Ver detalle">
              <Link to={`/administrador/rendiciones/show/${rendicion.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
            </Tooltip>
            {estado === "CONFIRMADA" && (
              <Tooltip title="Descargar PDF">
                <Button
                  size="small"
                  icon={<FilePdfOutlined />}
                  loading={descargandoId === rendicion.id}
                  onClick={() => descargarPdf(rendicion)}
                />
              </Tooltip>
            )}
            {puedeAnular && rendicion.puede_anular && (
              <Tooltip title="Anular">
                <Button size="small" danger icon={<StopOutlined />} onClick={() => anular(rendicion)} />
              </Tooltip>
            )}
          </Space>
        )}
      />
    </Table>
  );
};
