import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import { formatMonto } from "../../utils/monto";
import { formatPorcentaje } from "../../utils/porcentaje";
import type { ConceptoRow } from "./types";

export const ConceptoList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<ConceptoRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: ConceptoRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`conceptos/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Concepto de venta desactivado." : "Concepto de venta activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Conceptos de venta"
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="codigo" title="Código" />
        <Table.Column dataIndex="descripcion" title="Descripción" />
        <Table.Column
          title="Precio unitario"
          dataIndex="precio_unitario"
          render={(precio: string | null) => (precio === null ? "—" : formatMonto(precio))}
        />
        <Table.Column
          title="IVA"
          dataIndex="tasa_iva"
          render={(tasa: number | null) => (tasa === null ? "—" : formatPorcentaje(tasa))}
        />
        <Table.Column
          title="Estado"
          dataIndex="is_active"
          render={(isActive: boolean, record: ConceptoRow) => (
            <Space size={4} wrap>
              <Tag color={isActive ? "green" : "red"}>{isActive ? "Activo" : "Inactivo"}</Tag>
              <Tooltip title="Editar concepto de venta">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              {/* Ocultar desactivar en los conceptos de sistema; el backend igual lo rechaza. */}
              {isActive && record.es_de_sistema ? null : (
                <Tooltip title={isActive ? "Desactivar concepto de venta" : "Activar concepto de venta"}>
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
                        title: "¿Desactivar este concepto de venta?",
                        okText: "Desactivar",
                        okButtonProps: { danger: true },
                        onOk: () => toggleActive(record),
                      });
                    }}
                  />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
