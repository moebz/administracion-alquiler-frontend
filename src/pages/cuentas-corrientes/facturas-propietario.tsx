import { useEffect, useState } from "react";
import { App, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { kyInstance } from "../../providers/data";
import { MontoCell } from "./movimientos-table";
import type { FacturaPropietarioRow } from "./types";

const FORMATO_FECHA = "DD/MM/YYYY";

const ESTADO_LABEL: Record<FacturaPropietarioRow["estado"], string> = {
  BORRADOR: "Borrador",
  EMITIDO: "Emitida",
  ANULADO: "Anulada",
};

type Props = {
  propietarioId: number;
  /** Cambia cuando la cuenta facturó o transfirió con facturación, para volver a pedir las facturas. */
  version: number;
};

// Facturas emitidas al propietario (comisión y reintegro), de la más nueva a la más vieja, con su saldo abierto hasta
// que la compensación del desembolso las cierre.
export const FacturasPropietario = ({ propietarioId, version }: Props) => {
  const { message } = App.useApp();
  const [filas, setFilas] = useState<FacturaPropietarioRow[]>();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    kyInstance
      .get(`cuentas-corrientes/${propietarioId}/facturas`)
      .json<FacturaPropietarioRow[]>()
      .then((datos) => vigente && setFilas(datos))
      .catch((error: { message?: string }) => {
        if (vigente) {
          message.error(error.message ?? "No se pudieron cargar las facturas al propietario.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [propietarioId, version, message]);

  return (
    <Table<FacturaPropietarioRow>
      title={() => <Typography.Text strong>Facturas al propietario</Typography.Text>}
      dataSource={filas}
      loading={cargando}
      rowKey="id"
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "Todavía no se le facturó nada." }}
    >
      <Table.Column
        title="N.º"
        dataIndex="numero"
        render={(numero: string | null, factura: FacturaPropietarioRow) => (
          <Link to={`/administrador/facturas-venta/show/${factura.id}`}>{numero ?? factura.id}</Link>
        )}
      />
      <Table.Column title="Fecha" dataIndex="fecha" render={(fecha: string) => dayjs(fecha).format(FORMATO_FECHA)} />
      <Table.Column
        title="Vencimiento"
        dataIndex="vencimiento"
        render={(fecha: string | null) => (fecha ? dayjs(fecha).format(FORMATO_FECHA) : "—")}
      />
      <Table.Column title="Total" dataIndex="total" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column title="Saldo" dataIndex="saldo" align="right" render={(monto: string) => <MontoCell monto={monto} />} />
      <Table.Column
        title="Estado"
        dataIndex="estado"
        render={(estado: FacturaPropietarioRow["estado"]) => (
          <Tag color={estado === "EMITIDO" ? "green" : "default"}>{ESTADO_LABEL[estado]}</Tag>
        )}
      />
    </Table>
  );
};
