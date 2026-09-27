import { useState } from "react";
import { EditButton, List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { usePermissions } from "@refinedev/core";
import { Button, Select, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import { RegistrarFacturaModal } from "./registrar-factura-modal";
import { RegistrarPagoModal } from "./registrar-pago-modal";
import {
  GASTO_ESTADO_COLOR,
  GASTO_ESTADO_LABEL,
  GASTO_ESTADO_OPTIONS,
  GASTO_TIPO_LABEL,
  type GastoEstado,
  type GastoRow,
} from "./types";

// Sin Aprobar/Rechazar acá: esa acción es siempre del propietario de la
// unidad, desde su propio portal (pages/propietario-gastos/list.tsx) — el
// panel interno solo puede ver y editar (mientras el gasto siga SOLICITADO).
export const GastoList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<GastoRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
  });

  const [estado, setEstado] = useState<GastoEstado>();
  const [facturaDe, setFacturaDe] = useState<GastoRow>();
  const [pagoDe, setPagoDe] = useState<GastoRow>();

  const { data: permissions } = usePermissions<string[]>({});
  // Ver ARQUITECTURA.md, "Compras y pagos a proveedores": pagar un gasto
  // exige el permiso del módulo de alquileres Y el del dominio fiscal
  // correspondiente, no cualquiera de los dos por separado.
  const puedeRegistrarFactura =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("compras.registrar")) ?? false;
  const puedeRegistrarPago =
    (permissions?.includes("gastos.registrar_pago") && permissions?.includes("pagos.registrar")) ?? false;

  // Mismo criterio que pages/contratos-alquiler/list.tsx: recalcula el array completo de filtros en cada cambio.
  const applyFilters = (nextEstado: GastoEstado | undefined) => {
    setEstado(nextEstado);

    const filters: CrudFilter[] = [];
    if (nextEstado) {
      filters.push({ field: "estado", operator: "eq", value: nextEstado });
    }
    setFilters(filters, "replace");
  };

  return (
    <List title="Gastos" headerButtons={() => null}>
      <FilterBar>
        <Space>
          <span>Estado</span>
          <Select
            style={{ minWidth: 160 }}
            allowClear
            placeholder="Todos"
            options={GASTO_ESTADO_OPTIONS}
            value={estado}
            onChange={applyFilters}
          />
        </Space>
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Unidad"
          dataIndex="unidad"
          render={(unidad: GastoRow["unidad"]) => `${unidad.bloque.edificio.nombre} - ${unidad.bloque.nombre} - ${unidad.numero}`}
        />
        <Table.Column title="Tipo" dataIndex="tipo" render={(tipo: GastoRow["tipo"]) => GASTO_TIPO_LABEL[tipo]} />
        <Table.Column title="Descripción" dataIndex="descripcion" />
        <Table.Column
          dataIndex="fecha"
          title="Fecha"
          render={(fecha: GastoRow["fecha"]) => dayjs(fecha).format("DD/MM/YYYY")}
        />
        <Table.Column title="Período" dataIndex="periodo" render={(periodo: string | null) => periodo ?? "—"} />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          render={(monto: GastoRow["monto"]) => formatMonto(monto)}
        />
        <Table.Column title="Proveedor" dataIndex="proveedor" render={(proveedor: GastoRow["proveedor"]) => proveedor.nombre}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoGasto: GastoRow["estado"], record: GastoRow) => {
            const documento = record.documento_compra;
            const saldo = documento ? Number(documento.saldo) : 0;

            return (
              <Space direction="vertical" size={4}>
                <Space size={4} wrap>
                  <Tag color={GASTO_ESTADO_COLOR[estadoGasto]}>{GASTO_ESTADO_LABEL[estadoGasto]}</Tag>
                  {estadoGasto === "APROBADO" && !documento && puedeRegistrarFactura && (
                    <Tooltip title="Registrar la factura del proveedor">
                      <Button size="small" onClick={() => setFacturaDe(record)}>
                        Registrar factura
                      </Button>
                    </Tooltip>
                  )}
                  {documento && documento.estado === "REGISTRADO" && saldo > 0 && puedeRegistrarPago && (
                    <Tooltip title="Registrar un pago a cuenta de esta factura">
                      <Button size="small" onClick={() => setPagoDe(record)}>
                        Registrar pago
                      </Button>
                    </Tooltip>
                  )}
                </Space>
                {documento && (
                  <Link to={`/administrador/compras/show/${documento.id}`}>
                    Factura {documento.numero}
                    {saldo > 0 ? ` — saldo ${formatMonto(saldo)}` : ""}
                  </Link>
                )}
              </Space>
            );
          }}
        />
        <Table.Column
          title="Fecha de aprobación"
          dataIndex="fecha_aprobacion"
          render={(fechaAprobacion: GastoRow["fecha_aprobacion"]) =>
            fechaAprobacion ? dayjs(fechaAprobacion).format("DD/MM/YYYY HH:mm") : "—"
          }
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: GastoRow) =>
            record.estado === "SOLICITADO" ? <EditButton hideText size="small" recordItemId={record.id} /> : "—"
          }
        />
      </Table>
      {facturaDe && (
        <RegistrarFacturaModal
          gasto={facturaDe}
          onClose={() => setFacturaDe(undefined)}
          onSuccess={() => {
            setFacturaDe(undefined);
            tableQuery.refetch();
          }}
        />
      )}
      {pagoDe && (
        <RegistrarPagoModal
          gasto={pagoDe}
          onClose={() => setPagoDe(undefined)}
          onSuccess={() => {
            setPagoDe(undefined);
            tableQuery.refetch();
          }}
        />
      )}
    </List>
  );
};
