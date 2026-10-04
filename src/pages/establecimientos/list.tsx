import { EditButton, List, useTable } from "@refinedev/antd";
import { useGo } from "@refinedev/core";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { EstablecimientoRow } from "./types";

export const EstablecimientoList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<EstablecimientoRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();
  const go = useGo();

  const verPuntos = (record: EstablecimientoRow) =>
    go({
      to: { resource: "puntos-expedicion", action: "list" },
      query: {
        filters: [
          { field: "establecimiento_id", operator: "eq", value: record.id },
          { field: "is_active", operator: "eq", value: true },
        ],
      },
    });

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: EstablecimientoRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`establecimientos/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Establecimiento desactivado." : "Establecimiento activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Establecimientos"
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="codigo" title="Código" />
        <Table.Column
          title="Nombre"
          dataIndex="nombre"
          render={(nombre: string, record: EstablecimientoRow) => (
            <Space size={4} wrap>
              {nombre}
              <Button size="small" onClick={() => verPuntos(record)}>
                Ver puntos de expedición
              </Button>
            </Space>
          )}
        />
        <Table.Column dataIndex="direccion" title="Dirección" />
        <Table.Column
          title="Estado"
          dataIndex="is_active"
          render={(isActive: boolean, record: EstablecimientoRow) => (
            <Space size={4} wrap>
              <Tag color={isActive ? "green" : "red"}>{isActive ? "Activo" : "Inactivo"}</Tag>
              <Tooltip title="Editar establecimiento">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={isActive ? "Desactivar establecimiento" : "Activar establecimiento"}>
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
                      title: "¿Desactivar este establecimiento?",
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
