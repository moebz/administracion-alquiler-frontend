import { useState } from "react";
import { List, ShowButton, useSelect, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Select, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import {
  PAGO_PROVEEDOR_ESTADO_COLOR,
  PAGO_PROVEEDOR_ESTADO_LABEL,
  PAGO_PROVEEDOR_ESTADO_OPTIONS,
  type PagoProveedorEstado,
  type PagoProveedorRow,
} from "./types";

// Sin botón de crear: hoy todo pago nace desde un gasto (ver
// pages/gastos/registrar-pago.tsx), no hay alta directa (ver ARQUITECTURA.md).
export const PagoProveedorList = () => {
  const { tableProps, setFilters } = useTable<PagoProveedorRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
  });

  const [personaId, setPersonaId] = useState<number>();
  const [estado, setEstado] = useState<PagoProveedorEstado>();

  const { selectProps: personaSelectProps } = useSelect<{ id: number; nombre: string }>({
    resource: "personas",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const applyFilters = (overrides: { personaId?: number; estado?: PagoProveedorEstado }) => {
    const nextPersonaId = "personaId" in overrides ? overrides.personaId : personaId;
    const nextEstado = "estado" in overrides ? overrides.estado : estado;
    setPersonaId(nextPersonaId);
    setEstado(nextEstado);

    const filters: CrudFilter[] = [];
    if (nextPersonaId) filters.push({ field: "persona_id", operator: "eq", value: nextPersonaId });
    if (nextEstado) filters.push({ field: "estado", operator: "eq", value: nextEstado });
    setFilters(filters, "replace");
  };

  return (
    <List title="Pagos a proveedores" headerButtons={() => null}>
      <FilterBar>
        <Space>
          <span>Proveedor</span>
          <Select
            options={personaSelectProps.options}
            onSearch={personaSelectProps.onSearch}
            filterOption={personaSelectProps.filterOption}
            showSearch
            style={{ minWidth: 220 }}
            allowClear
            placeholder="Todos"
            value={personaId}
            onChange={(value) => applyFilters({ personaId: value })}
          />
        </Space>
        <Space>
          <span>Estado</span>
          <Select
            style={{ minWidth: 160 }}
            allowClear
            placeholder="Todos"
            options={PAGO_PROVEEDOR_ESTADO_OPTIONS}
            value={estado}
            onChange={(value) => applyFilters({ estado: value })}
          />
        </Space>
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column title="N°" dataIndex="numero" />
        <Table.Column title="Proveedor" dataIndex="persona" render={(persona: PagoProveedorRow["persona"]) => persona.nombre} />
        <Table.Column dataIndex="fecha" title="Fecha" render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")} />
        <Table.Column
          title="Monto"
          dataIndex="monto_total"
          render={(monto: PagoProveedorRow["monto_total"]) => formatMonto(monto)}
        />
        <Table.Column title="Concepto" dataIndex="concepto" render={(concepto: string | null) => concepto ?? "—"} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoPago: PagoProveedorEstado) => (
            <Tag color={PAGO_PROVEEDOR_ESTADO_COLOR[estadoPago]}>{PAGO_PROVEEDOR_ESTADO_LABEL[estadoPago]}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: PagoProveedorRow) => (
            <Tooltip title="Ver detalle">
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Tooltip>
          )}
        />
      </Table>
    </List>
  );
};
