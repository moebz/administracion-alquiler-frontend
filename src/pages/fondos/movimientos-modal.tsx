import { useList } from "@refinedev/core";
import { Modal, Table, Tag } from "antd";
import dayjs from "dayjs";
import { formatMonto } from "../../utils/monto";
import type { FondoRow } from "./types";
import { MOVIMIENTO_FONDO_ORIGEN_LABEL, MOVIMIENTO_FONDO_TIPO_LABEL, type MovimientoFondoRow } from "./types";

// Modal en vez de ruta propia: así hereda el mismo CanAccess que ya protege
// el listado de fondos (fondos.ver) y el backend igual exige fondos.ver_saldo
// en /fondos/{id}/movimientos — el botón que abre esto ya está gateado por
// ese permiso en pages/fondos/list.tsx.
export const FondoMovimientosModal = ({ fondo, onClose }: { fondo: FondoRow; onClose: () => void }) => {
  const { result: movimientos, query } = useList<MovimientoFondoRow>({
    resource: `fondos/${fondo.id}/movimientos`,
    pagination: { mode: "off" },
    sorters: [{ field: "fecha", order: "desc" }],
  });

  return (
    <Modal title={`Movimientos de ${fondo.nombre}`} open onCancel={onClose} footer={null} width={720}>
      <Table dataSource={movimientos?.data} rowKey="id" size="small" loading={query.isLoading} pagination={{ pageSize: 10 }}>
        <Table.Column dataIndex="fecha" title="Fecha" render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")} />
        <Table.Column
          dataIndex="tipo"
          title="Tipo"
          render={(tipo: MovimientoFondoRow["tipo"]) => (
            <Tag color={tipo === "INGRESO" ? "green" : "red"}>{MOVIMIENTO_FONDO_TIPO_LABEL[tipo]}</Tag>
          )}
        />
        <Table.Column dataIndex="concepto" title="Concepto" render={(concepto: string | null) => concepto ?? "—"} />
        <Table.Column
          dataIndex="origen_tipo"
          title="Origen"
          render={(origen: MovimientoFondoRow["origen_tipo"]) => MOVIMIENTO_FONDO_ORIGEN_LABEL[origen]}
        />
        <Table.Column dataIndex="monto_gs" title="Monto" render={(monto: MovimientoFondoRow["monto_gs"]) => formatMonto(monto)} />
        <Table.Column
          dataIndex="estado"
          title="Estado"
          render={(estado: MovimientoFondoRow["estado"]) => (
            <Tag color={estado === "ACTIVO" ? "green" : "default"}>{estado === "ACTIVO" ? "Activo" : "Anulado"}</Tag>
          )}
        />
      </Table>
    </Modal>
  );
};
