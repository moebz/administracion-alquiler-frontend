import { useEffect, useState } from "react";
import { App, Button, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import { EyeOutlined, StopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { MontoCell } from "./movimientos-table";
import { LIQUIDACION_ESTADO_LABEL, type LiquidacionHistorialRow } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

type Props = {
  propietarioId: number;
  puedeAnular: boolean;
  /** Cambia cuando la cuenta confirmó o anuló una liquidación, para volver a pedir el historial. */
  version: number;
  /** Se llama después de anular, para que la cuenta recargue sus movimientos. */
  onAnulada: () => void;
};

// Historial de liquidaciones del propietario, de la más nueva a la más vieja. Solo la última confirmada se puede anular.
export const HistorialLiquidaciones = ({ propietarioId, puedeAnular, version, onAnulada }: Props) => {
  const { message, modal } = App.useApp();

  const [filas, setFilas] = useState<LiquidacionHistorialRow[]>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/liquidaciones`)
      .json<LiquidacionHistorialRow[]>()
      .then((datos) => vigente && setFilas(datos))
      .catch((error: { message?: string }) => {
        if (vigente) {
          message.error(error.message ?? "No se pudo cargar el historial de liquidaciones.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, version, message]);

  const anular = (liquidacion: LiquidacionHistorialRow) => {
    let motivo = "";

    modal.confirm({
      title: "¿Anular esta liquidación?",
      content: (
        <>
          <Typography.Paragraph>
            Sus movimientos vuelven a quedar sin liquidar y los toma la próxima liquidación.
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

        const response = await kyInstance.patch(`liquidaciones/${liquidacion.id}/anular`, { json: { motivo_anulacion: motivo } });
        if (!response.ok) {
          message.error(await extractErrorMessage(response, "No se pudo anular la liquidación."));
          throw new Error("anulación rechazada");
        }

        message.success("Liquidación anulada.");
        onAnulada();
      },
    });
  };

  return (
    <Table<LiquidacionHistorialRow>
      title={() => <Typography.Text strong>Liquidaciones</Typography.Text>}
      dataSource={filas}
      loading={cargando}
      rowKey="id"
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "Todavía no se le liquidó nada." }}
    >
      <Table.Column title="N.º" dataIndex="id" />
      <Table.Column title="Corte" dataIndex="corte" render={(corte: string) => dayjs(corte).format(FORMATO_FECHA)} />
      <Table.Column title="Saldo anterior" dataIndex="saldo_anterior" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column title="Saldo final" dataIndex="saldo_final" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column
        title="Estado"
        dataIndex="estado"
        render={(estado: LiquidacionHistorialRow["estado"], liquidacion: LiquidacionHistorialRow) => (
          <Space size={4} wrap>
            <Tag color={estado === "CONFIRMADA" ? "green" : "default"}>{LIQUIDACION_ESTADO_LABEL[estado]}</Tag>
            <Tooltip title="Ver detalle">
              <Link to={`/administrador/liquidaciones/show/${liquidacion.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
            </Tooltip>
            {puedeAnular && liquidacion.puede_anular && (
              <Tooltip title="Anular">
                <Button size="small" danger icon={<StopOutlined />} onClick={() => anular(liquidacion)} />
              </Tooltip>
            )}
          </Space>
        )}
      />
    </Table>
  );
};
