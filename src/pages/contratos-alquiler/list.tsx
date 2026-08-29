import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Popconfirm, Space, Table, Tag } from "antd";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import {
  CONTRATO_ALQUILER_ESTADO_COLOR,
  CONTRATO_ALQUILER_ESTADO_LABEL,
  type ContratoAlquilerRow,
} from "./types";

export const ContratoAlquilerList = () => {
  const { tableProps, tableQuery } = useTable<ContratoAlquilerRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha_inicio", order: "desc" }] },
  });
  const { message } = App.useApp();

  const rescindir = async (record: ContratoAlquilerRow) => {
    const response = await kyInstance.patch(`contratos-alquiler/${record.id}/rescindir`);
    if (response.ok) {
      message.success("Contrato rescindido.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo rescindir el contrato."));
    }
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Unidad"
          dataIndex="unidad"
          render={(unidad: ContratoAlquilerRow["unidad"]) =>
            `${unidad.bloque.edificio.nombre} - ${unidad.bloque.nombre} - ${unidad.numero}`
          }
        />
        <Table.Column
          title="Propietario"
          dataIndex="unidad"
          render={(unidad: ContratoAlquilerRow["unidad"]) => unidad.propietario.nombre}
        />
        <Table.Column
          title="Inquilino"
          dataIndex="inquilino"
          render={(inquilino: ContratoAlquilerRow["inquilino"]) => inquilino.nombre}
        />
        <Table.Column
          title="Monto"
          dataIndex="monto_alquiler"
          render={(monto: number) => monto.toLocaleString("es-UY", { style: "currency", currency: "UYU" })}
        />
        <Table.Column title="Día venc." dataIndex="dia_vencimiento" />
        <Table.Column
          title="Mora diaria"
          dataIndex="porcentaje_mora_diario"
          render={(porcentaje: number) => `${porcentaje}%`}
        />
        <Table.Column dataIndex="fecha_inicio" title="Inicio" />
        <Table.Column dataIndex="fecha_fin" title="Fin" />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estado: ContratoAlquilerRow["estado"]) => (
            <Tag color={CONTRATO_ALQUILER_ESTADO_COLOR[estado]}>{CONTRATO_ALQUILER_ESTADO_LABEL[estado]}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: ContratoAlquilerRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              {record.estado === "VIGENTE" && (
                <Popconfirm
                  title="¿Rescindir este contrato?"
                  okText="Rescindir"
                  cancelText="Cancelar"
                  onConfirm={() => rescindir(record)}
                >
                  <Button size="small" danger>
                    Rescindir
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
