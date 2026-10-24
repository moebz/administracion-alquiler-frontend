import { useState } from "react";
import { List, ShowButton, useSelect, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Select, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { formatMonto } from "../../utils/monto";
import { COBRO_ESTADO_COLOR, COBRO_ESTADO_LABEL, COBRO_ESTADO_OPTIONS, type CobroEstado, type CobroRow } from "./types";

// Sin botón de crear: todo cobro nace desde un contrato (botón "Cobrar" en contratos de alquiler, en el
// detalle de la unidad y en Cargos), no hay alta directa.
export const CobroList = () => {
  const { tableProps, setFilters } = useTable<CobroRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
  });

  const [personaId, setPersonaId] = useState<number>();
  const [estado, setEstado] = useState<CobroEstado>();

  const { selectProps: personaSelectProps } = useSelect<{ id: number; nombre: string }>({
    resource: "personas",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const applyFilters = (overrides: { personaId?: number; estado?: CobroEstado }) => {
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
    <List title="Cobros" headerButtons={() => null}>
      <FilterBar>
        <Space>
          <span>Inquilino</span>
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
            options={COBRO_ESTADO_OPTIONS}
            value={estado}
            onChange={(value) => applyFilters({ estado: value })}
          />
        </Space>
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column title="N°" dataIndex="numero" />
        <Table.Column title="Inquilino" dataIndex="persona" render={(persona: CobroRow["persona"]) => persona.nombre} />
        <Table.Column title="Unidad" dataIndex="unidad" render={(unidad: CobroRow["unidad"]) => unidad ?? "—"} />
        <Table.Column
          title="Facturas"
          dataIndex="facturas"
          render={(facturas: CobroRow["facturas"]) =>
            facturas.length > 0 ? facturas.map((factura) => <div key={factura.id}>{factura.numero ?? "—"}</div>) : "—"
          }
        />
        <Table.Column dataIndex="fecha" title="Fecha" render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")} />
        <Table.Column
          title="Monto"
          dataIndex="monto_total"
          align="right"
          render={(monto: CobroRow["monto_total"]) => formatMonto(monto)}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoCobro: CobroEstado) => (
            <Tag color={COBRO_ESTADO_COLOR[estadoCobro]}>{COBRO_ESTADO_LABEL[estadoCobro]}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: CobroRow) => (
            <Tooltip title="Ver detalle">
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Tooltip>
          )}
        />
      </Table>
    </List>
  );
};
