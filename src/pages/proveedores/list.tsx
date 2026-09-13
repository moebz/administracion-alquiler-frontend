import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { ProveedorRow } from "./types";

export const ProveedorList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<ProveedorRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: ProveedorRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`proveedores/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Proveedor desactivado." : "Proveedor activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Proveedores"
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="nombre" title="Nombre" />
        <Table.Column dataIndex={["persona", "documento"]} title="Documento" />
        <Table.Column
          dataIndex="rubros"
          title="Rubros"
          render={(rubros: ProveedorRow["rubros"]) => rubros.map((rubro) => rubro.nombre).join(", ")}
        />
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
          render={(_, record: ProveedorRow) => (
            <Space>
              <Tooltip title="Editar proveedor">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={record.is_active ? "Desactivar proveedor" : "Activar proveedor"}>
                <Button
                  size="small"
                  danger={record.is_active}
                  icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                  onClick={() => {
                    if (!record.is_active) {
                      toggleActive(record);
                      return;
                    }
                    modal.confirm({
                      title: "¿Desactivar este proveedor?",
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
