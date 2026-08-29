import { EditButton, List, useTable } from "@refinedev/antd";
import { useGo } from "@refinedev/core";
import { App, Button, Space, Table, Tag } from "antd";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { BloqueRow } from "./types";

export const BloqueList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<BloqueRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message } = App.useApp();
  const go = useGo();

  const verUnidades = (record: BloqueRow) =>
    go({
      to: { resource: "unidades", action: "list" },
      query: {
        filters: [
          { field: "bloque_id", operator: "eq", value: record.id },
          { field: "is_active", operator: "eq", value: true },
        ],
      },
    });

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: BloqueRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`bloques/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Bloque desactivado." : "Bloque activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Edificio"
          dataIndex="edificio"
          render={(edificio: BloqueRow["edificio"]) => edificio.nombre}
        />
        <Table.Column dataIndex="nombre" title="Nombre" />
        <Table.Column dataIndex="capacidad_dptos" title="Capacidad (dptos)" />
        <Table.Column dataIndex="anio_construccion" title="Año de construcción" />
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
          render={(_, record: BloqueRow) => (
            <Space>
              <Button size="small" onClick={() => verUnidades(record)}>
                Ver unidades
              </Button>
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
