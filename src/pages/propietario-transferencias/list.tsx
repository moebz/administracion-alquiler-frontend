import { useEffect, useState } from "react";
import { SendOutlined, SwapOutlined } from "@ant-design/icons";
import { List } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { App, Space, Table, Tag, Tooltip, Typography } from "antd";
import { PageTitle } from "../../components/page-title";
import { SectionDivider } from "../../components/section-divider";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { MontoCell } from "../cuentas-corrientes/movimientos-table";
import { formatearFecha, formatearInstante } from "../solicitudes-transferencia/textos";
import {
  SOLICITUD_TRANSFERENCIA_ESTADO_COLOR,
  SOLICITUD_TRANSFERENCIA_ESTADO_LABEL,
  type SolicitudTransferencia,
  type TransferenciaRecibida,
} from "../solicitudes-transferencia/types";

/** Dice cuándo y por qué se anuló la transferencia, para el tooltip del estado. */
const armarTextoDeAnulacion = (transferencia: TransferenciaRecibida): string => {
  const fecha = transferencia.fecha_anulacion ? `el ${formatearFecha(transferencia.fecha_anulacion)}` : "";
  return `Anulada ${fecha}: ${transferencia.motivo_anulacion ?? ""}`.replace(/\s+/g, " ").trim();
};

// Transferencias del propietario: las solicitudes que hizo y las transferencias que recibió. Solo lee; pedir y cancelar
// se hacen desde el inicio. Las solicitudes se piden con transferencias.solicitar: sin ese permiso solo ve las recibidas.
export const PropietarioTransferenciaList = () => {
  const { message } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeSolicitar = permissions?.includes("transferencias.solicitar") ?? false;
  const [solicitudes, setSolicitudes] = useState<SolicitudTransferencia[]>([]);
  const [transferencias, setTransferencias] = useState<TransferenciaRecibida[]>([]);
  const [cargando, setCargando] = useState(true);

  // Pedir las transferencias y, con permiso, las solicitudes.
  useEffect(() => {
    // Esperar a conocer los permisos para no pedir las solicitudes de más ni de menos.
    if (permissions === undefined) {
      return;
    }

    let vigente = true;
    const pedidos: Promise<unknown>[] = [
      kyInstance
        .get("propietario/transferencias")
        .json<TransferenciaRecibida[]>()
        .then((datos) => vigente && setTransferencias(datos)),
    ];

    if (puedeSolicitar) {
      pedidos.push(
        kyInstance
          .get("propietario/solicitudes-transferencia")
          .json<SolicitudTransferencia[]>()
          .then((datos) => vigente && setSolicitudes(datos)),
      );
    }

    Promise.all(pedidos)
      .catch((error: { message?: string }) => {
        // Los GET fallidos se rechazan con el mensaje del servidor (ver providers/data.ts).
        if (vigente) {
          message.error(error.message ?? "No se pudieron cargar las transferencias.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [permissions, puedeSolicitar, message]);

  return (
    <List title={<PageTitle icon={<SwapOutlined />}>Transferencias</PageTitle>} headerButtons={() => null}>
      {puedeSolicitar && (
        <>
          <SectionDivider icon={<SendOutlined />}>Mis solicitudes</SectionDivider>
          <Table<SolicitudTransferencia>
            dataSource={solicitudes}
            loading={cargando}
            rowKey="id"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          >
            <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => formatearInstante(fecha)} />
            <Table.Column title="Monto pedido" dataIndex="monto" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
            <Table.Column
              title="Cuenta"
              dataIndex="cuenta"
              render={(cuenta: SolicitudTransferencia["cuenta"]) => (cuenta ? `${cuenta.banco} - ${cuenta.numero_cuenta}` : "—")}
            />
            <Table.Column
              title="Estado"
              dataIndex="estado"
              render={(estado: SolicitudTransferencia["estado"], solicitud: SolicitudTransferencia) => (
                <Space size={4} wrap>
                  <Tag color={SOLICITUD_TRANSFERENCIA_ESTADO_COLOR[estado]}>{SOLICITUD_TRANSFERENCIA_ESTADO_LABEL[estado]}</Tag>
                  {/* Avisar que la transferencia que la atendió se anuló, tanto si volvió a pendiente como si quedó transferida. */}
                  {solicitud.pago_anulado?.fecha && (
                    <Typography.Text type="secondary">
                      La transferencia del {formatearFecha(solicitud.pago_anulado.fecha)} se anuló
                    </Typography.Text>
                  )}
                </Space>
              )}
            />
            <Table.Column
              title="Transferido"
              dataIndex="transferido"
              align="right"
              render={(transferido: string | null) => (transferido === null ? "—" : formatMonto(transferido))}
            />
            <Table.Column title="Motivo" dataIndex="motivo_rechazo" render={(motivo: string | null) => motivo ?? "—"} />
          </Table>
        </>
      )}

      <SectionDivider icon={<SwapOutlined />}>Transferencias recibidas</SectionDivider>
      <Table<TransferenciaRecibida>
        dataSource={transferencias}
        loading={cargando}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      >
        <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => formatearFecha(fecha)} />
        <Table.Column title="N.º" dataIndex="numero" />
        <Table.Column title="Monto" dataIndex="monto_total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: TransferenciaRecibida["estado"], transferencia: TransferenciaRecibida) => (
            // Explicar en el tooltip de la anulada cuándo y por qué se anuló.
            <Tooltip title={estado === "ANULADO" ? armarTextoDeAnulacion(transferencia) : undefined}>
              <Tag color={estado === "ACTIVO" ? "green" : "default"}>{estado === "ACTIVO" ? "Activa" : "Anulada"}</Tag>
            </Tooltip>
          )}
        />
      </Table>
    </List>
  );
};
