import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import type { TimbradoRangoRow, TimbradoRow } from "./types";

const formatFecha = (fecha: string) => dayjs(fecha).format("DD/MM/YYYY");
const formatNumero = (numero: number) => String(numero).padStart(7, "0");

const estadoTag = (record: TimbradoRow) => {
  if (!record.is_active) return <Tag color="red">Inactivo</Tag>;
  if (record.vigente) return <Tag color="green">Vigente</Tag>;
  if (record.vigencia_hasta && dayjs().isAfter(record.vigencia_hasta, "day")) return <Tag color="orange">Vencido</Tag>;
  return <Tag>Aún no vigente</Tag>;
};

const RangosTable = ({ rangos }: { rangos: TimbradoRangoRow[] }) => (
  <Table dataSource={rangos} rowKey="id" pagination={false} size="small">
    <Table.Column title="Punto de expedición" dataIndex="punto_expedicion" render={(punto: TimbradoRangoRow["punto_expedicion"]) => punto.codigo_completo} />
    <Table.Column title="Tipo" dataIndex="tipo_comprobante_label" />
    <Table.Column title="Serie" dataIndex="serie" render={(serie: string | null) => serie ?? "—"} />
    <Table.Column
      title="Desde – hasta"
      render={(_, rango: TimbradoRangoRow) => `${formatNumero(rango.numero_desde)} – ${formatNumero(rango.numero_hasta)}`}
    />
    <Table.Column
      title="Último usado"
      render={(_, rango: TimbradoRangoRow) => (rango.usado ? formatNumero(rango.ultimo_numero) : "—")}
    />
    <Table.Column title="Disponibles" dataIndex="disponibles" render={(disponibles: number) => disponibles.toLocaleString("es-PY")} />
  </Table>
);

export const TimbradoList = () => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<TimbradoRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message, modal } = App.useApp();

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const toggleActive = async (record: TimbradoRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`timbrados/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Timbrado desactivado." : "Timbrado activado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List
      title="Timbrados"
      headerButtons={({ defaultButtons }) => (
        <>
          <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
          {defaultButtons}
        </>
      )}
    >
      <Table
        {...tableProps}
        rowKey="id"
        expandable={{ expandedRowRender: (record: TimbradoRow) => <RangosTable rangos={record.rangos} /> }}
      >
        <Table.Column dataIndex="numero_timbrado" title="Número" />
        <Table.Column dataIndex="tipo_label" title="Tipo" />
        <Table.Column
          title="Vigencia"
          render={(_, record: TimbradoRow) =>
            record.vigencia_hasta
              ? `${formatFecha(record.vigencia_desde)} – ${formatFecha(record.vigencia_hasta)}`
              : `desde ${formatFecha(record.vigencia_desde)}`
          }
        />
        <Table.Column
          title="Estado"
          render={(_, record: TimbradoRow) => (
            <Space size={4} wrap>
              {estadoTag(record)}
              <Tooltip title="Editar timbrado">
                <EditButton hideText size="small" recordItemId={record.id} />
              </Tooltip>
              <Tooltip title={record.is_active ? "Desactivar timbrado" : "Activar timbrado"}>
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
                      title: "¿Desactivar este timbrado?",
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
