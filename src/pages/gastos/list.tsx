import { useState } from "react";
import { EditButton, List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { FilterBar } from "../../components/filter-bar";
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
        <Table.Column dataIndex="fecha" title="Fecha" />
        <Table.Column title="Período" dataIndex="periodo" render={(periodo: string | null) => periodo ?? "—"} />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          render={(monto: number) => monto.toLocaleString("es-PY", { style: "currency", currency: "PYG" })}
        />
        <Table.Column title="Proveedor" dataIndex="proveedor" render={(proveedor: GastoRow["proveedor"]) => proveedor.nombre}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoGasto: GastoRow["estado"]) => (
            <Tag color={GASTO_ESTADO_COLOR[estadoGasto]}>{GASTO_ESTADO_LABEL[estadoGasto]}</Tag>
          )}
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
    </List>
  );
};
