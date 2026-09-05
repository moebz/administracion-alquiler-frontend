import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import { UNIDAD_ESTADO_COLOR, UNIDAD_ESTADO_LABEL, type UnidadRow } from "./types";

export const UnidadList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<UnidadRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message } = App.useApp();
  const navigate = useNavigate();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) => {
    const otrosFiltros = filters.filter((filter) => !("field" in filter) || filter.field !== "is_active");
    setFilters(checked ? otrosFiltros : [...otrosFiltros, { field: "is_active", operator: "eq", value: true }], "replace");
  };

  const toggleActive = async (record: UnidadRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`unidades/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Unidad desactivada." : "Unidad activada.");
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
        <Table.Column dataIndex="numero" title="Número" />
        <Table.Column
          title="Edificio"
          dataIndex="bloque"
          render={(bloque: UnidadRow["bloque"]) => bloque.edificio.nombre}
        />
        <Table.Column
          title="Bloque"
          dataIndex="bloque"
          render={(bloque: UnidadRow["bloque"]) => bloque.nombre}
        />
        <Table.Column
          title="Propietario"
          dataIndex="propietario"
          render={(propietario: UnidadRow["propietario"]) => propietario.nombre}
        />
        <Table.Column dataIndex="piso" title="Piso" />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: UnidadRow["estado"], record: UnidadRow) => (
            <Tag color={UNIDAD_ESTADO_COLOR[estado]}>
              {estado === "OCUPADA" && record.contrato_vigente_fecha_fin
                ? `Ocupada hasta ${dayjs(record.contrato_vigente_fecha_fin).format("DD/MM/YYYY")}`
                : UNIDAD_ESTADO_LABEL[estado]}
            </Tag>
          )}
        />
        <Table.Column
          title="Activa"
          dataIndex="is_active"
          render={(isActive: boolean) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Activa" : "Inactiva"}</Tag>}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: UnidadRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              {!record.contrato_vigente_fecha_fin && (
                <Button
                  size="small"
                  onClick={() => navigate(`/administrador/contratos-alquiler/create?unidad_id=${record.id}`)}
                >
                  Crear contrato
                </Button>
              )}
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
