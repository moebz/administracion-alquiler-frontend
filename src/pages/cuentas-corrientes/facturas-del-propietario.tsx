import { useCallback, useEffect, useState } from "react";
import { StopOutlined, FileAddOutlined } from "@ant-design/icons";
import { usePermissions } from "@refinedev/core";
import { App, Button, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { COMPRA_CONDICION_LABEL, COMPRA_ESTADO_COLOR, COMPRA_ESTADO_LABEL } from "../compras/types";
import { MontoCell } from "./movimientos-table";
import { RegistrarNcPropietarioModal } from "./registrar-nc-propietario-modal";
import type { FacturaDelPropietarioNotaRow, FacturaDelPropietarioRow } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

type Props = {
  propietarioId: number;
  /** Cambia cuando la cuenta registró o anuló un documento del propietario, para volver a pedir las facturas. */
  version: number;
  /** Se llama después de registrar o anular una factura o una NC, para que la cuenta recargue lo que le falta documentar. */
  onCambio: () => void;
};

// Facturas que emitió el propietario por sus alquileres (registradas como compra), de la más nueva a la más vieja, con
// sus NC. Se corrigen anulando y volviendo a registrar: no se editan.
export const FacturasDelPropietario = ({ propietarioId, version, onCambio }: Props) => {
  const { message, modal } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  // Registrar y anular piden el permiso del módulo y el del core (ver el backend).
  const puedeRegistrar = (permissions?.includes("liquidaciones.registrar_documentos") && permissions?.includes("compras.registrar")) ?? false;
  const puedeAnular = (permissions?.includes("liquidaciones.registrar_documentos") && permissions?.includes("compras.anular")) ?? false;
  // Anular una NC con aplicaciones activas pide además anular pagos.
  const puedeAnularPagos = permissions?.includes("pagos.anular") ?? false;

  const [filas, setFilas] = useState<FacturaDelPropietarioRow[]>();
  const [cargando, setCargando] = useState(true);
  const [conNc, setConNc] = useState<FacturaDelPropietarioRow>();

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/facturas-del-propietario`)
      .json<FacturaDelPropietarioRow[]>()
      .then((datos) => vigente && setFilas(datos))
      .catch((error: { message?: string }) => {
        if (vigente) {
          message.error(error.message ?? "No se pudieron cargar las facturas del propietario.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, version, message]);

  const cerrarNc = useCallback(() => setConNc(undefined), []);

  // Pide el motivo y anula; `ruta` es la ruta de anulación y `json` lo que se manda además del motivo.
  const anular = (titulo: string, contenido: string, ruta: string, exito: string, json: Record<string, unknown> = {}) => {
    let motivo = "";

    modal.confirm({
      title: titulo,
      content: (
        <>
          <Typography.Paragraph>{contenido}</Typography.Paragraph>
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

        const response = await kyInstance.patch(ruta, { json: { motivo_anulacion: motivo, ...json } });
        if (!response.ok) {
          message.error(await extractErrorMessage(response, "No se pudo anular."));
          throw new Error("anulación rechazada");
        }

        message.success(exito);
        onCambio();
      },
    });
  };

  const anularFactura = (factura: FacturaDelPropietarioRow) =>
    anular(
      "¿Anular la factura del propietario?",
      "Sus alquileres vuelven a quedar por documentar. El número queda libre para registrarla de nuevo. Para anularla antes hay que anular sus NC.",
      `cuentas-corrientes/${propietarioId}/facturas-del-propietario/${factura.id}/anular`,
      "Factura anulada.",
    );

  const anularNota = (factura: FacturaDelPropietarioRow, nota: FacturaDelPropietarioNotaRow) =>
    anular(
      "¿Anular la NC del propietario?",
      nota.tiene_aplicaciones_activas
        ? "Sus aplicaciones a la factura se anulan con ella y la cuota vuelve a quedar abierta. La NC vuelve a quedar por documentar."
        : "La NC vuelve a quedar por documentar.",
      `cuentas-corrientes/${propietarioId}/facturas-del-propietario/${factura.id}/notas-credito/${nota.id}/anular`,
      "NC anulada.",
      { confirmar_aplicaciones: nota.tiene_aplicaciones_activas },
    );

  return (
    <>
      <Table<FacturaDelPropietarioRow>
        title={() => <Typography.Text strong>Facturas del propietario</Typography.Text>}
        dataSource={filas}
        loading={cargando}
        rowKey="id"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Todavía no se registró ninguna factura del propietario." }}
        expandable={{
          rowExpandable: (factura) => factura.notas.length > 0,
          expandedRowRender: (factura) => (
            <Table<FacturaDelPropietarioNotaRow>
              dataSource={factura.notas}
              rowKey="id"
              size="small"
              pagination={false}
            >
              <Table.Column
                title="NC"
                dataIndex="numero"
                render={(numero: string, nota: FacturaDelPropietarioNotaRow) => (
                  <Link to={`/administrador/compras/show/${nota.id}`}>{numero}</Link>
                )}
              />
              <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)} />
              <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
              <Table.Column
                title="Estado"
                dataIndex="estado"
                render={(estado: FacturaDelPropietarioNotaRow["estado"], nota: FacturaDelPropietarioNotaRow) => (
                  <Space size={4} wrap>
                    <Tag color={COMPRA_ESTADO_COLOR[estado]}>{COMPRA_ESTADO_LABEL[estado]}</Tag>
                    {puedeAnular && estado === "REGISTRADO" && (!nota.tiene_aplicaciones_activas || puedeAnularPagos) && (
                      <Tooltip title="Anular">
                        <Button size="small" danger icon={<StopOutlined />} onClick={() => anularNota(factura, nota)} />
                      </Tooltip>
                    )}
                  </Space>
                )}
              />
            </Table>
          ),
        }}
      >
        <Table.Column
          title="N.º"
          dataIndex="numero"
          render={(numero: string, factura: FacturaDelPropietarioRow) => (
            <Link to={`/administrador/compras/show/${factura.id}`}>{numero}</Link>
          )}
        />
        <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)} />
        <Table.Column
          title="Condición"
          dataIndex="condicion"
          render={(condicion: FacturaDelPropietarioRow["condicion"]) => COMPRA_CONDICION_LABEL[condicion]}
        />
        <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column title="Saldo" dataIndex="saldo" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: FacturaDelPropietarioRow["estado"], factura: FacturaDelPropietarioRow) => (
            <Space size={4} wrap>
              <Tag color={COMPRA_ESTADO_COLOR[estado]}>{COMPRA_ESTADO_LABEL[estado]}</Tag>
              {puedeRegistrar && estado === "REGISTRADO" && (
                <Tooltip title="Registrar NC">
                  <Button size="small" icon={<FileAddOutlined />} onClick={() => setConNc(factura)} />
                </Tooltip>
              )}
              {puedeAnular && estado === "REGISTRADO" && (
                <Tooltip title="Anular">
                  <Button size="small" danger icon={<StopOutlined />} onClick={() => anularFactura(factura)} />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>

      {conNc && (
        <RegistrarNcPropietarioModal
          propietarioId={propietarioId}
          facturaId={conNc.id}
          onClose={cerrarNc}
          onRegistrada={() => {
            cerrarNc();
            onCambio();
          }}
        />
      )}
    </>
  );
};
