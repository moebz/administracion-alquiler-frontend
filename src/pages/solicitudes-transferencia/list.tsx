import { useState } from "react";
import { CloseOutlined, SendOutlined, SwapOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import { useInvalidate, usePermissions } from "@refinedev/core";
import { Button, Select, Space, Table, Tag, Tooltip } from "antd";
import { Link } from "react-router";
import { FilterBar } from "../../components/filter-bar";
import { PageTitle } from "../../components/page-title";
import { TransferirModal } from "../cuentas-corrientes/transferir-modal";
import { MontoCell } from "../cuentas-corrientes/movimientos-table";
import { RechazarSolicitudModal } from "./rechazar-modal";
import { formatearFecha, formatearInstante } from "./textos";
import {
  SOLICITUD_TRANSFERENCIA_ESTADO_COLOR,
  SOLICITUD_TRANSFERENCIA_ESTADO_LABEL,
  SOLICITUD_TRANSFERENCIA_ESTADO_OPTIONS,
  type SolicitudTransferenciaEstado,
  type SolicitudTransferenciaFila,
} from "./types";

// Solicitudes de transferencia de los propietarios, con las pendientes primero. Transferir abre el modal de siempre
// con el monto y la cuenta de la solicitud; rechazar pide un motivo que el propietario ve.
export const SolicitudTransferenciaList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<SolicitudTransferenciaFila>({
    resource: "solicitudes-transferencia",
    syncWithLocation: true,
    pagination: { mode: "off" },
    filters: { initial: [{ field: "estado", operator: "eq", value: "PENDIENTE" }] },
  });
  const { data: permissions } = usePermissions<string[]>({});
  const invalidate = useInvalidate();
  // Rechazar pide el permiso de transferir; transferir pide además el de registrar pagos (ver el backend).
  const puedeRechazar = permissions?.includes("liquidaciones.transferir") ?? false;
  const puedeTransferir = (puedeRechazar && permissions?.includes("pagos.registrar")) ?? false;
  const puedeVerCuenta = permissions?.includes("cuenta_corriente.ver") ?? false;

  const [estado, setEstado] = useState<SolicitudTransferenciaEstado | undefined>("PENDIENTE");
  const [transfiriendo, setTransfiriendo] = useState<SolicitudTransferenciaFila>();
  const [rechazando, setRechazando] = useState<SolicitudTransferenciaFila>();

  const aplicarEstado = (siguiente: SolicitudTransferenciaEstado | undefined) => {
    setEstado(siguiente);
    setFilters(siguiente ? [{ field: "estado", operator: "eq", value: siguiente }] : [], "replace");
  };

  // Recargar la tabla y el contador del menú después de transferir o rechazar.
  const recargar = () => {
    tableQuery.refetch();
    invalidate({ resource: "solicitudes-transferencia", invalidates: ["list"] });
  };

  return (
    <List title={<PageTitle icon={<SendOutlined />}>Solicitudes de transferencia</PageTitle>} headerButtons={() => null}>
      <FilterBar>
        <Space>
          <span>Estado</span>
          <Select
            style={{ minWidth: 200 }}
            allowClear
            placeholder="Todas"
            options={SOLICITUD_TRANSFERENCIA_ESTADO_OPTIONS}
            value={estado}
            onChange={aplicarEstado}
          />
        </Space>
      </FilterBar>

      <Table<SolicitudTransferenciaFila> {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => formatearInstante(fecha)} />
        <Table.Column
          title="Propietario"
          dataIndex="propietario"
          render={(propietario: SolicitudTransferenciaFila["propietario"]) =>
            puedeVerCuenta ? <Link to={`/administrador/cuentas-corrientes/show/${propietario.id}`}>{propietario.nombre}</Link> : propietario.nombre
          }
        />
        <Table.Column title="Monto pedido" dataIndex="monto" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
        <Table.Column
          title="Cuenta"
          dataIndex="cuenta"
          render={(cuenta: SolicitudTransferenciaFila["cuenta"]) => (cuenta ? `${cuenta.banco} - ${cuenta.numero_cuenta}` : "Sin cuenta")}
        />
        <Table.Column
          title="Disponible hoy"
          dataIndex="disponible"
          align="right"
          // Solo las pendientes traen el disponible: es lo que decide si se puede atender.
          render={(disponible: string | undefined) => (disponible === undefined ? "—" : <MontoCell monto={disponible} />)}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoDeFila: SolicitudTransferenciaEstado, fila: SolicitudTransferenciaFila) => (
            <Space size={4} wrap>
              {/* Explicar en el tooltip de la rechazada por qué se rechazó. */}
              <Tooltip title={estadoDeFila === "RECHAZADA" ? fila.motivo_rechazo : undefined}>
                <Tag color={SOLICITUD_TRANSFERENCIA_ESTADO_COLOR[estadoDeFila]}>
                  {SOLICITUD_TRANSFERENCIA_ESTADO_LABEL[estadoDeFila]}
                </Tag>
              </Tooltip>
              {/* Mostrar que la transferencia que la atendió se anuló, si la solicitud la conserva. */}
              {fila.pago_anulado?.fecha && fila.estado === "PENDIENTE" && (
                <Tooltip title={`La transferencia del ${formatearFecha(fila.pago_anulado.fecha)} se anuló`}>
                  <Tag>Transferencia anulada</Tag>
                </Tooltip>
              )}
              {/* Atender solo las pendientes. */}
              {estadoDeFila === "PENDIENTE" && puedeTransferir && (
                <Tooltip title="Transferir">
                  <Button size="small" icon={<SwapOutlined />} onClick={() => setTransfiriendo(fila)} />
                </Tooltip>
              )}
              {estadoDeFila === "PENDIENTE" && puedeRechazar && (
                <Tooltip title="Rechazar">
                  <Button size="small" icon={<CloseOutlined />} onClick={() => setRechazando(fila)} />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>

      {transfiriendo && (
        <TransferirModal
          propietarioId={transfiriendo.propietario.id}
          onClose={() => setTransfiriendo(undefined)}
          onTransferida={() => {
            setTransfiriendo(undefined);
            recargar();
          }}
        />
      )}

      {rechazando && (
        <RechazarSolicitudModal
          solicitud={rechazando}
          onClose={() => setRechazando(undefined)}
          onRechazada={() => {
            setRechazando(undefined);
            recargar();
          }}
        />
      )}
    </List>
  );
};
