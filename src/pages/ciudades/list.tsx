import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag } from "antd";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { CiudadRow } from "./types";

export const CiudadList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<CiudadRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message } = App.useApp();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: CiudadRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`ciudades/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Ciudad desactivada." : "Ciudad activada.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Ciudades"
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="nombre" title="Nombre" />
        <Table.Column
          title="Estado"
          dataIndex="is_active"
          render={(isActive: boolean) => (
            <Tag color={isActive ? "green" : "red"}>{isActive ? "Activo" : "Inactivo"}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: CiudadRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <Button size="small" danger={record.is_active} onClick={() => toggleActive(record)}>
                {record.is_active ? "Desactivar" : "Activar"}
              </Button>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
