import { useState } from "react";
import { ContainerOutlined, EyeOutlined, FilePdfOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { PageTitle } from "../../components/page-title";
import { descargarPdfDeLiquidacion } from "../../utils/descargar";
import { MontoCell } from "../cuentas-corrientes/movimientos-table";
import { LIQUIDACION_ESTADO_LABEL, type LiquidacionResumen } from "../cuentas-corrientes/types";

const FORMATO_FECHA = "DD/MM/YYYY";

/** Dice cuándo y por qué se anuló la liquidación, para el tooltip del estado. */
const textoDeAnulacion = (liquidacion: LiquidacionResumen): string => {
  const fecha = liquidacion.fecha_anulacion ? `el ${dayjs(liquidacion.fecha_anulacion).format(FORMATO_FECHA)}` : "";
  return `Anulada ${fecha}: ${liquidacion.motivo_anulacion ?? ""}`.replace(/\s+/g, " ").trim();
};

// Liquidaciones del propietario, también las anuladas. Solo ve y descarga: el PDF está solo en las confirmadas.
export const PropietarioLiquidacionList = () => {
  const { message } = App.useApp();
  const { tableProps } = useTable<LiquidacionResumen>({ resource: "propietario/liquidaciones", syncWithLocation: true });
  const [descargandoId, setDescargandoId] = useState<number>();

  // Descargar el PDF de la liquidación, o mostrar por qué no se pudo.
  const descargarPdf = async (liquidacion: LiquidacionResumen) => {
    setDescargandoId(liquidacion.id);
    try {
      await descargarPdfDeLiquidacion(liquidacion.id, liquidacion.corte, "propietario/");
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargandoId(undefined);
    }
  };

  return (
    <List title={<PageTitle icon={<ContainerOutlined />}>Liquidaciones</PageTitle>}>
      <Table<LiquidacionResumen> {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column
          title="N.º"
          dataIndex="id"
          render={(id: number) => <Link to={`/propietario/liquidaciones/show/${id}`}>N.º {id}</Link>}
        />
        <Table.Column title="Corte" dataIndex="corte" render={(corte: string) => dayjs(corte).format(FORMATO_FECHA)} />
        <Table.Column title="Saldo anterior" dataIndex="saldo_anterior" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column title="Saldo final" dataIndex="saldo_final" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: LiquidacionResumen["estado"], liquidacion: LiquidacionResumen) => (
            <Space size={4} wrap>
              {/* Explicar en el tooltip de la anulada cuándo y por qué se anuló. */}
              <Tooltip title={estado === "ANULADA" ? textoDeAnulacion(liquidacion) : undefined}>
                <Tag color={estado === "CONFIRMADA" ? "green" : "default"}>{LIQUIDACION_ESTADO_LABEL[estado]}</Tag>
              </Tooltip>
              <Tooltip title="Ver detalle">
                <Link to={`/propietario/liquidaciones/show/${liquidacion.id}`}>
                  <Button size="small" icon={<EyeOutlined />} />
                </Link>
              </Tooltip>
              {/* El PDF es solo de la confirmada: la anulada ya no tiene. */}
              {estado === "CONFIRMADA" && (
                <Tooltip title="Descargar PDF">
                  <Button
                    size="small"
                    icon={<FilePdfOutlined />}
                    loading={descargandoId === liquidacion.id}
                    onClick={() => descargarPdf(liquidacion)}
                  />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
