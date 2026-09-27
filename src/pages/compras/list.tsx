import { useState } from "react";
import { List, ShowButton, useSelect, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Select, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import { COMPRA_ESTADO_COLOR, COMPRA_ESTADO_LABEL, COMPRA_ESTADO_OPTIONS, type CompraEstado, type CompraRow } from "./types";

// Sin botón de crear: hoy toda compra nace desde un gasto (ver
// pages/gastos/registrar-factura.tsx), no hay alta directa (ver ARQUITECTURA.md).
export const CompraList = () => {
  const { tableProps, setFilters } = useTable<CompraRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
  });

  const [personaId, setPersonaId] = useState<number>();
  const [estado, setEstado] = useState<CompraEstado>();

  const { selectProps: personaSelectProps } = useSelect<{ id: number; nombre: string }>({
    resource: "personas",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const applyFilters = (overrides: { personaId?: number; estado?: CompraEstado }) => {
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
    <List title="Compras" headerButtons={() => null}>
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
            options={COMPRA_ESTADO_OPTIONS}
            value={estado}
            onChange={(value) => applyFilters({ estado: value })}
          />
        </Space>
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column title="Proveedor" dataIndex="persona" render={(persona: CompraRow["persona"]) => persona.nombre} />
        <Table.Column title="Número" dataIndex="numero" />
        <Table.Column title="Timbrado" dataIndex="timbrado_proveedor" />
        <Table.Column dataIndex="fecha" title="Fecha" render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")} />
        <Table.Column title="Total" dataIndex="total" render={(total: CompraRow["total"]) => formatMonto(total)} />
        <Table.Column title="Saldo" dataIndex="saldo" render={(saldo: CompraRow["saldo"]) => formatMonto(saldo)} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoCompra: CompraEstado) => (
            <Tag color={COMPRA_ESTADO_COLOR[estadoCompra]}>{COMPRA_ESTADO_LABEL[estadoCompra]}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: CompraRow) => (
            <Tooltip title="Ver detalle">
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Tooltip>
          )}
        />
      </Table>
    </List>
  );
};
