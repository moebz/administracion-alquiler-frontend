import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { TipoIdentificacionRow } from "./types";

export const TipoIdentificacionList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<TipoIdentificacionRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: TipoIdentificacionRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`tipos-identificacion/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Tipo de identificación desactivado." : "Tipo de identificación activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Tipos de identificación"
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="codigo" title="Código" />
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
          render={(_, record: TipoIdentificacionRow) => (
            <Space>
              <Tooltip title="Editar tipo de identificación">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={record.is_active ? "Desactivar tipo de identificación" : "Activar tipo de identificación"}>
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
                      title: "¿Desactivar este tipo de identificación?",
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
