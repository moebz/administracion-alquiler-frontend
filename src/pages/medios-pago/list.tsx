import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { MedioPagoRow } from "./types";

export const MedioPagoList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<MedioPagoRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: MedioPagoRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`medios-pago/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Medio de pago desactivado." : "Medio de pago activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Medios de pago"
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
          title="Requiere datos bancarios"
          dataIndex="requiere_datos_bancarios"
          render={(requiere: boolean) => (requiere ? "Sí" : "No")}
        />
        <Table.Column
          title="Estado"
          dataIndex="is_active"
          render={(isActive: boolean, record: MedioPagoRow) => (
            <Space size={4} wrap>
              <Tag color={isActive ? "green" : "red"}>{isActive ? "Activo" : "Inactivo"}</Tag>
              <Tooltip title="Editar medio de pago">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={isActive ? "Desactivar medio de pago" : "Activar medio de pago"}>
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
                      title: "¿Desactivar este medio de pago?",
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
