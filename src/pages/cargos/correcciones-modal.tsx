import { useEffect, useState } from "react";
import { Modal, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import type { CorreccionRow } from "./types";

// Muestra el historial del cargo y de sus ajustes: una fila por cada cambio de monto, con su monto con signo y el resultante.
export const CorreccionesModal = ({
  cargo,
  onClose,
}: {
  cargo: { id: number; descripcion: string };
  onClose: () => void;
}) => {
  const [filas, setFilas] = useState<CorreccionRow[] | undefined>();

  useEffect(() => {
    kyInstance
      .get(`cargos/${cargo.id}/correcciones`)
      .json<CorreccionRow[]>()
      .then(setFilas)
      .catch(() => setFilas([]));
  }, [cargo.id]);

  return (
    <Modal title={`Historial · ${cargo.descripcion}`} open onCancel={onClose} footer={null} width={960}>
      <Table<CorreccionRow> dataSource={filas} loading={filas === undefined} rowKey="id" pagination={false} size="small" scroll={{ x: "max-content" }}>
        <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY HH:mm")} />
        <Table.Column
          title="Cargo"
          dataIndex="cargo_descripcion"
          render={(descripcion: string, fila: CorreccionRow) => (
            <>
              <div>{descripcion}</div>
              {fila.es_ajuste && (
                <Link to={`/administrador/cargos?cargo_id=${fila.cargo_id}&todos_los_estados=1`}>Ver el ajuste {fila.cargo_id}</Link>
              )}
            </>
          )}
        />
        <Table.Column title="Acción" dataIndex="accion_label" render={(label: string) => <Tag>{label}</Tag>} />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          align="right"
          render={(monto: string) => {
            const valor = Number(monto);
            return <Typography.Text type={valor < 0 ? "danger" : undefined}>{`${valor > 0 ? "+" : ""}${formatMonto(valor)}`}</Typography.Text>;
          }}
        />
        <Table.Column title="Monto resultante" dataIndex="monto_resultante" align="right" render={(monto: string) => formatMonto(monto)} />
        <Table.Column title="Motivo" dataIndex="motivo" />
        <Table.Column title="Quién" dataIndex="usuario" render={(usuario: string | null) => usuario ?? "—"} />
        <Table.Column
          title="Documento"
          key="documento"
          render={(_, fila: CorreccionRow) => {
            // Enlazar la factura que corrige la NC, o mostrar la línea del proveedor a la que se reapuntó.
            if (fila.documento_venta) {
              const destino = fila.documento_venta.documento_ref_id ?? fila.documento_venta.id;
              return <Link to={`/administrador/facturas-venta/show/${destino}`}>NC {fila.documento_venta.numero ?? fila.documento_venta.id}</Link>;
            }
            if (fila.linea_proveedor) {
              return <Link to={`/administrador/compras/show/${fila.linea_proveedor.documento_compra_id}`}>{fila.linea_proveedor.descripcion}</Link>;
            }
            return "—";
          }}
        />
      </Table>
    </Modal>
  );
};
