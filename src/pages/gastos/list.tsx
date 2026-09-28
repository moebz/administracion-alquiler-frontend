import { useState } from "react";
import { List, ShowButton, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Select, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import {
  GASTO_ESTADO_COLOR,
  GASTO_ESTADO_LABEL,
  GASTO_ESTADO_OPTIONS,
  GASTO_TIPO_LABEL,
  type GastoEstado,
  type GastoRow,
} from "./types";

// Lista de solo lectura: Registrar factura/pago, Anular y Editar viven en el
// detalle de cada gasto (pages/gastos/show.tsx) — un único lugar para todas
// las acciones, en vez de duplicarlas acá (ver ARQUITECTURA.md, "Gastos").
export const GastoList = () => {
  const { tableProps, setFilters } = useTable<GastoRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
  });

  const [estado, setEstado] = useState<GastoEstado>();

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
                <Tag color={GASTO_ESTADO_COLOR[estadoGasto]}>{GASTO_ESTADO_LABEL[estadoGasto]}</Tag>
                {documento && (
                  <Tooltip title="Ver el detalle de la factura en el gasto">
                    <span>
                      Factura {documento.numero}
                      {saldo > 0 ? ` — saldo ${formatMonto(saldo)}` : ""}
                    </span>
                  </Tooltip>
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
          render={(_, record: GastoRow) => (
            <Tooltip title="Ver detalle">
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Tooltip>
          )}
        />
      </Table>
    </List>
  );
};
