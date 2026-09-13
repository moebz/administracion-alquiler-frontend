import { useState } from "react";
import { EditButton, List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { App, Button, Select, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { FilterBar } from "../../components/filter-bar";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import { FONDO_TIPO_LABEL, FONDO_TIPO_OPTIONS, type FondoRow, type FondoTipo } from "./types";

export const FondoList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<FondoRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();

  const [tipo, setTipo] = useState<FondoTipo>();
  const [showInactive, setShowInactive] = useState(false);

  // Mismo criterio que pages/personas/list.tsx: recalcula el array completo de filtros en cada cambio.
  const applyFilters = (overrides: { tipo?: FondoTipo; showInactive?: boolean }) => {
    const nextTipo = "tipo" in overrides ? overrides.tipo : tipo;
    const nextShowInactive = overrides.showInactive ?? showInactive;

    setTipo(nextTipo);
    setShowInactive(nextShowInactive);

    const filters: CrudFilter[] = [];
    if (nextTipo) {
      filters.push({ field: "tipo", operator: "eq", value: nextTipo });
    }
    if (!nextShowInactive) {
      filters.push({ field: "is_active", operator: "eq", value: true });
    }
    setFilters(filters, "replace");
  };

  const toggleActive = async (record: FondoRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`fondos/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Fondo desactivado." : "Fondo activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List title="Fondos">
      <FilterBar>
        <Space>
          <span>Tipo</span>
          <Select
            style={{ minWidth: 160 }}
            allowClear
            placeholder="Todos"
            options={FONDO_TIPO_OPTIONS}
            value={tipo}
            onChange={(value) => applyFilters({ tipo: value })}
          />
        </Space>
        <ActiveFilterSwitch checked={showInactive} onChange={(checked) => applyFilters({ showInactive: checked })} />
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="nombre" title="Nombre" />
        <Table.Column title="Tipo" dataIndex="tipo" render={(tipoFondo: FondoRow["tipo"]) => FONDO_TIPO_LABEL[tipoFondo]} />
        <Table.Column
          title="Banco"
          dataIndex="banco"
          render={(banco: FondoRow["banco"]) => banco?.nombre ?? "—"}
        />
        <Table.Column
          title="Número de cuenta"
          dataIndex="numero_cuenta"
          render={(numeroCuenta: string | null) => numeroCuenta ?? "—"}
        />
        <Table.Column
          title="Estado"
          dataIndex="is_active"
          render={(isActive: boolean, record: FondoRow) => (
            <Space size={4} wrap>
              <Tag color={isActive ? "green" : "red"}>{isActive ? "Activo" : "Inactivo"}</Tag>
              <Tooltip title="Editar fondo">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={isActive ? "Desactivar fondo" : "Activar fondo"}>
                <Button
                  size="small"
                  danger={isActive}
                  icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                  onClick={() => {
                    if (!isActive) {
                      toggleActive(record);
                      return;
                    }
                    modal.confirm({
                      title: "¿Desactivar este fondo?",
                      okText: "Desactivar",
                      okButtonProps: { danger: true },
                      onOk: () => toggleActive(record),
                    });
                  }}
                />
              </Tooltip>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
