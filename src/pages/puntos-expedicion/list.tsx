import { CreateButton, EditButton, List, useTable } from "@refinedev/antd";
import { useGo } from "@refinedev/core";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { PuntoExpedicionRow } from "./types";

export const PuntoExpedicionList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<PuntoExpedicionRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();
  const go = useGo();

  const establecimientoId = filters.find(
    (filter) => "field" in filter && filter.field === "establecimiento_id",
  )?.value as number | string | undefined;
  const crear = () =>
    go({
      to: { resource: "puntos-expedicion", action: "create" },
      query: establecimientoId ? { establecimiento_id: establecimientoId } : undefined,
    });

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: PuntoExpedicionRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`puntos-expedicion/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Punto de expedición desactivado." : "Punto de expedición activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Puntos de expedición"
      headerButtons={({ createButtonProps }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {createButtonProps && <CreateButton {...createButtonProps} onClick={crear} />}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Establecimiento"
          dataIndex="establecimiento"
          render={(establecimiento: PuntoExpedicionRow["establecimiento"]) =>
            `${establecimiento.codigo} - ${establecimiento.nombre}`
          }
        />
        <Table.Column dataIndex="codigo_completo" title="Código" />
        <Table.Column dataIndex="descripcion" title="Descripción" />
        <Table.Column
          title="Estado"
          dataIndex="is_active"
          render={(isActive: boolean, record: PuntoExpedicionRow) => (
            <Space size={4} wrap>
              <Tag color={isActive ? "green" : "red"}>{isActive ? "Activo" : "Inactivo"}</Tag>
              <Tooltip title="Editar punto de expedición">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={isActive ? "Desactivar punto de expedición" : "Activar punto de expedición"}>
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
                      title: "¿Desactivar este punto de expedición?",
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
