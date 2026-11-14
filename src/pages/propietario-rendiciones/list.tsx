import { useState } from "react";
import { ContainerOutlined, EyeOutlined, FilePdfOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { PageTitle } from "../../components/page-title";
import { descargarPdfDeRendicion } from "../../utils/descargar";
import { MontoCell } from "../cuentas-corrientes/movimientos-table";
import { RENDICION_ESTADO_LABEL, type RendicionResumen } from "../cuentas-corrientes/types";

const FORMATO_FECHA = "DD/MM/YYYY";

/** Dice cuándo y por qué se anuló la rendición, para el tooltip del estado. */
const textoDeAnulacion = (rendicion: RendicionResumen): string => {
  const fecha = rendicion.fecha_anulacion ? `el ${dayjs(rendicion.fecha_anulacion).format(FORMATO_FECHA)}` : "";
  return `Anulada ${fecha}: ${rendicion.motivo_anulacion ?? ""}`.replace(/\s+/g, " ").trim();
};

// Rendiciones del propietario, también las anuladas. Solo ve y descarga: el PDF está solo en las confirmadas.
export const PropietarioRendicionList = () => {
  const { message } = App.useApp();
  const { tableProps } = useTable<RendicionResumen>({ resource: "propietario/rendiciones", syncWithLocation: true });
  const [descargandoId, setDescargandoId] = useState<number>();

  // Descargar el PDF de la rendición, o mostrar por qué no se pudo.
  const descargarPdf = async (rendicion: RendicionResumen) => {
    setDescargandoId(rendicion.id);
    try {
      await descargarPdfDeRendicion(rendicion.id, rendicion.corte, "propietario/");
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargandoId(undefined);
    }
  };

  return (
    <List title={<PageTitle icon={<ContainerOutlined />}>Rendiciones</PageTitle>}>
      <Table<RendicionResumen> {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column
          title="N.º"
          dataIndex="id"
          render={(id: number) => <Link to={`/propietario/rendiciones/show/${id}`}>N.º {id}</Link>}
        />
        <Table.Column title="Corte" dataIndex="corte" render={(corte: string) => dayjs(corte).format(FORMATO_FECHA)} />
        <Table.Column title="Saldo anterior" dataIndex="saldo_anterior" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column title="Saldo final" dataIndex="saldo_final" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: RendicionResumen["estado"], rendicion: RendicionResumen) => (
            <Space size={4} wrap>
              {/* Explicar en el tooltip de la anulada cuándo y por qué se anuló. */}
              <Tooltip title={estado === "ANULADA" ? textoDeAnulacion(rendicion) : undefined}>
                <Tag color={estado === "CONFIRMADA" ? "green" : "default"}>{RENDICION_ESTADO_LABEL[estado]}</Tag>
              </Tooltip>
              <Tooltip title="Ver detalle">
                <Link to={`/propietario/rendiciones/show/${rendicion.id}`}>
                  <Button size="small" icon={<EyeOutlined />} />
                </Link>
              </Tooltip>
              {/* El PDF es solo de la confirmada: la anulada ya no tiene. */}
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
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
