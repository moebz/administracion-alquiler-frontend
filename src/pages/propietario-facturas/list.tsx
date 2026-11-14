import { useState } from "react";
import { FileDoneOutlined, FilePdfOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { PageTitle } from "../../components/page-title";
import { descargarPdfDeDocumentoVenta } from "../../utils/descargar";
import { formatMonto } from "../../utils/monto";
import {
  FACTURA_PROPIETARIO_ESTADO_COLOR,
  FACTURA_PROPIETARIO_ESTADO_LABEL,
  FACTURA_PROPIETARIO_TIPO_LABEL,
  type FacturaPropietario,
} from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";
const FORMATO_FECHA_HORA = "DD/MM/YYYY HH:mm";

/** Dice cuándo y por qué se anuló el documento, para el tooltip del estado. */
const armarTextoDeAnulacion = (factura: FacturaPropietario): string => {
  const fecha = factura.fecha_anulacion ? `el ${dayjs(factura.fecha_anulacion).format(FORMATO_FECHA_HORA)}` : "";
  return `Anulada ${fecha}: ${factura.motivo_anulacion ?? ""}`.replace(/\s+/g, " ").trim();
};

// Facturas y NC que la administradora le emitió al propietario, también las anuladas. Solo lista y descarga el PDF.
export const PropietarioFacturaList = () => {
  const { message } = App.useApp();
  const { tableProps } = useTable<FacturaPropietario>({ resource: "propietario/facturas-venta", syncWithLocation: true });
  const [descargandoId, setDescargandoId] = useState<number>();

  // Descargar el PDF del documento, o mostrar por qué no se pudo.
  const descargarPdf = async (factura: FacturaPropietario) => {
    setDescargandoId(factura.id);
    try {
      await descargarPdfDeDocumentoVenta(factura.id, factura.tipo, factura.numero, "propietario/");
    } catch (error) {
      message.error((error as { message?: string }).message ?? "No se pudo descargar el PDF.");
    } finally {
      setDescargandoId(undefined);
    }
  };

  return (
    <List title={<PageTitle icon={<FileDoneOutlined />}>Facturas</PageTitle>}>
      <Table<FacturaPropietario> {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column
          title="Tipo"
          dataIndex="tipo"
          render={(tipo: FacturaPropietario["tipo"]) => FACTURA_PROPIETARIO_TIPO_LABEL[tipo]}
        />
        <Table.Column
          title="Número"
          dataIndex="numero"
          render={(numero: string, factura: FacturaPropietario) => (
            <>
              {numero}
              {/* Aclarar en una NC cuál es la factura que corrige. */}
              {factura.factura_asociada && (
                <div>
                  <small>Sobre la factura {factura.factura_asociada}</small>
                </div>
              )}
            </>
          )}
        />
        <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)} />
        <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => formatMonto(monto)} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: FacturaPropietario["estado"], factura: FacturaPropietario) => (
            <Space size={4} wrap>
              {/* Explicar en el tooltip de la anulada cuándo y por qué se anuló. */}
              <Tooltip title={estado === "ANULADO" ? armarTextoDeAnulacion(factura) : undefined}>
                <Tag color={FACTURA_PROPIETARIO_ESTADO_COLOR[estado]}>{FACTURA_PROPIETARIO_ESTADO_LABEL[estado]}</Tag>
              </Tooltip>
              {/* La anulada también se descarga: su PDF lleva el tag de anulada. */}
              <Tooltip title="Descargar PDF">
                <Button
                  size="small"
                  icon={<FilePdfOutlined />}
                  loading={descargandoId === factura.id}
                  onClick={() => descargarPdf(factura)}
                />
              </Tooltip>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
