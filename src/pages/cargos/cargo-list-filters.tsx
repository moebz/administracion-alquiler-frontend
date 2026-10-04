import { useState } from "react";
import { useSelect } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { DatePicker, Select, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { buildFiltrosCargos, FILTROS_CARGOS_INICIALES, type FiltrosCargos } from "./filtros";
import { CARGO_ESTADO_OPTIONS, CARGO_TIPO_OPTIONS } from "./types";

const { RangePicker } = DatePicker;

const filtrarPorLabel = (input: string, option?: { label?: unknown }) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());

export const CargoListFilters = ({ onChange }: { onChange: (filters: CrudFilter[]) => void }) => {
  const [filtros, setFiltros] = useState<FiltrosCargos>(FILTROS_CARGOS_INICIALES);

  const { selectProps: inquilinoSelectProps } = useSelect<{ id: number; nombre: string; documento: string }>({
    resource: "personas",
    optionLabel: (persona) => `${persona.nombre} (${persona.documento})`,
    optionValue: "id",
    filters: [{ field: "roles", operator: "in", value: ["inquilino"] }],
    onSearch: (value) => (value ? [{ field: "search", operator: "eq", value }] : []),
  });

  const { selectProps: edificioSelectProps } = useSelect({
    resource: "edificios",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const { selectProps: unidadSelectProps } = useSelect<{ id: number; numero: string; bloque: { nombre: string } }>({
    resource: "unidades",
    optionLabel: (unidad) => `${unidad.bloque.nombre} - ${unidad.numero}`,
    optionValue: "id",
    filters: filtros.edificioId ? [{ field: "edificio_id", operator: "eq", value: filtros.edificioId }] : [],
  });

  // Recalcula el array completo de filtros en cada cambio, mergeando sobre el estado local (mismo criterio que PersonaListFilters).
  const applyFilters = (overrides: Partial<FiltrosCargos>) => {
    const next = { ...filtros, ...overrides };
    setFiltros(next);
    onChange(buildFiltrosCargos(next));
  };

  const rangoPeriodo: [Dayjs | null, Dayjs | null] = [
    filtros.periodoDesde ? dayjs(`${filtros.periodoDesde}-01`) : null,
    filtros.periodoHasta ? dayjs(`${filtros.periodoHasta}-01`) : null,
  ];

  return (
    <FilterBar>
      <Space>
        <span>Inquilino</span>
        <Select
          showSearch
          options={inquilinoSelectProps.options}
          loading={inquilinoSelectProps.loading}
          onSearch={inquilinoSelectProps.onSearch}
          filterOption={false}
          style={{ minWidth: 240 }}
          allowClear
          placeholder="Todos"
          value={filtros.inquilinoId}
          onChange={(value) => applyFilters({ inquilinoId: value })}
        />
      </Space>
      <Space>
        <span>Edificio</span>
        <Select
          options={edificioSelectProps.options}
          loading={edificioSelectProps.loading}
          style={{ minWidth: 180 }}
          allowClear
          placeholder="Todos"
          value={filtros.edificioId}
          onChange={(value) => applyFilters({ edificioId: value, unidadId: undefined })}
        />
      </Space>
      <Space>
        <span>Unidad</span>
        <Select
          options={unidadSelectProps.options}
          loading={unidadSelectProps.loading}
          filterOption={filtrarPorLabel}
          showSearch
          style={{ minWidth: 160 }}
          allowClear
          placeholder="Todas"
          value={filtros.unidadId}
          onChange={(value) => applyFilters({ unidadId: value })}
        />
      </Space>
      <Space>
        <span>Tipo</span>
        <Select
          style={{ minWidth: 140 }}
          allowClear
          placeholder="Todos"
          options={CARGO_TIPO_OPTIONS}
          value={filtros.tipo}
          onChange={(value) => applyFilters({ tipo: value })}
        />
      </Space>
      <Space>
        <span>Estado</span>
        <Select
          mode="multiple"
          style={{ minWidth: 280 }}
          allowClear
          placeholder="Todos"
          options={CARGO_ESTADO_OPTIONS}
          value={filtros.estados}
          onChange={(value) => applyFilters({ estados: value })}
        />
      </Space>
      <Space>
        <span>Período</span>
        <RangePicker
          picker="month"
          format="MM/YYYY"
          value={rangoPeriodo}
          onChange={(value) =>
            applyFilters({
              periodoDesde: value?.[0]?.format("YYYY-MM"),
              periodoHasta: value?.[1]?.format("YYYY-MM"),
            })
          }
        />
      </Space>
    </FilterBar>
  );
};
