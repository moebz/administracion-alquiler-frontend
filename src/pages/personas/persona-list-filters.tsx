import { useState } from "react";
import { useSelect } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { Input, Select, Space } from "antd";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { FilterBar } from "../../components/filter-bar";
import { capitalize } from "../../utils/strings";
import { ACCOUNT_STATUS_OPTIONS } from "./account-status";

type Filtros = {
  search?: string;
  roles: string[];
  estadoCuenta?: string;
  showInactive: boolean;
};

const FILTROS_INICIALES: Filtros = { roles: [], showInactive: false };

// Fila de filtros del header de PersonaList: cada filtro es independiente,
// así que se recalcula el array completo de CrudFilters cada vez que cambia
// uno (mergeando sobre el estado local), en vez de tratar de mergear contra
// `filters` de useTable (más simple que parsear su forma de vuelta).
export const PersonaListFilters = ({ onChange }: { onChange: (filters: CrudFilter[]) => void }) => {
  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: (role: { name: string }) => capitalize(role.name),
    optionValue: "name",
  });

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);

  const applyFilters = (overrides: Partial<Filtros>) => {
    const next = { ...filtros, ...overrides };
    setFiltros(next);

    const filters: CrudFilter[] = [];
    if (next.search) {
      filters.push({ field: "search", operator: "eq", value: next.search });
    }
    if (next.roles.length > 0) {
      filters.push({ field: "roles", operator: "in", value: next.roles });
    }
    if (next.estadoCuenta) {
      filters.push({ field: "estado_cuenta", operator: "eq", value: next.estadoCuenta });
    }
    if (!next.showInactive) {
      filters.push({ field: "is_active", operator: "eq", value: true });
    }
    onChange(filters);
  };

  return (
    <FilterBar>
      <Input.Search
        allowClear
        placeholder="Buscar por nombre, documento o email"
        style={{ width: 280 }}
        defaultValue={filtros.search}
        onSearch={(value) => applyFilters({ search: value || undefined })}
      />
      <Space>
        <span>Roles</span>
        <Select
          mode="multiple"
          style={{ minWidth: 220 }}
          allowClear
          placeholder="Todos"
          options={roleSelectProps.options}
          value={filtros.roles}
          onChange={(value) => applyFilters({ roles: value })}
        />
      </Space>
      <Space>
        <span>Estado de cuenta</span>
        <Select
          style={{ minWidth: 200 }}
          allowClear
          placeholder="Todos"
          options={ACCOUNT_STATUS_OPTIONS}
          value={filtros.estadoCuenta}
          onChange={(value) => applyFilters({ estadoCuenta: value })}
        />
      </Space>
      <ActiveFilterSwitch
        checked={filtros.showInactive}
        onChange={(checked) => applyFilters({ showInactive: checked })}
      />
    </FilterBar>
  );
};
