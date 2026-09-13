import { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { FilterBar } from "../../components/filter-bar";
import { kyInstance } from "../../providers/data";
import { formatMonto } from "../../utils/monto";
import { extractErrorMessage } from "../../providers/auth";
import { GASTO_ESTADO_COLOR, GASTO_TIPO_LABEL, type GastoEstado, type GastoRow } from "../gastos/types";
import { GASTO_ESTADO_LABEL_PROPIETARIO, GASTO_ESTADO_OPTIONS_PROPIETARIO } from "./types";

/**
 * Portal del propietario: solo ve los gastos a_cargo_de=PROPIETARIO de sus
 * propias unidades (lo filtra el backend, ver
 * App\Http\Controllers\Propietario\GastoController) — a diferencia de
 * pages/gastos/list.tsx (admin), acá no hay alta/edición ni columna "a cargo
 * de" (siempre es él).
 */
export const GastoAprobacionList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<GastoRow>({
    resource: "propietario/gastos",
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
    filters: { initial: [{ field: "estado", operator: "eq", value: "SOLICITADO" }] },
  });
  const { message } = App.useApp();

  const [estado, setEstado] = useState<GastoEstado | undefined>("SOLICITADO");
  const [rechazando, setRechazando] = useState<GastoRow | null>(null);
  const [formRechazo] = Form.useForm<{ motivo_rechazo: string }>();

  const applyEstado = (nextEstado: GastoEstado | undefined) => {
    setEstado(nextEstado);
    setFilters(nextEstado ? [{ field: "estado", operator: "eq", value: nextEstado }] : [], "replace");
  };

  const aprobar = async (record: GastoRow) => {
    const response = await kyInstance.patch(`propietario/gastos/${record.id}/aprobar`);
    if (response.ok) {
      message.success("Gasto aprobado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo aprobar el gasto."));
    }
  };

  const rechazar = async (values: { motivo_rechazo: string }) => {
    if (!rechazando) return;

    const response = await kyInstance.patch(`propietario/gastos/${rechazando.id}/rechazar`, { json: values });
    if (response.ok) {
      message.success("Gasto rechazado.");
      setRechazando(null);
      formRechazo.resetFields();
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo rechazar el gasto."));
    }
  };

  return (
    <List title="Gastos a mi cargo" headerButtons={() => null}>
      <FilterBar>
        <Space>
          <span>Estado</span>
          <Select
            style={{ minWidth: 220 }}
            allowClear
            placeholder="Todos"
            options={GASTO_ESTADO_OPTIONS_PROPIETARIO}
            value={estado}
            onChange={applyEstado}
          />
        </Space>
      </FilterBar>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Unidad"
          dataIndex="unidad"
          render={(unidad: GastoRow["unidad"]) => `${unidad.bloque.edificio.nombre} - ${unidad.bloque.nombre} - ${unidad.numero}`}
        />
        <Table.Column title="Tipo" dataIndex="tipo" render={(tipo: GastoRow["tipo"]) => GASTO_TIPO_LABEL[tipo]} />
        <Table.Column title="Descripción" dataIndex="descripcion" />
        <Table.Column
          dataIndex="fecha"
          title="Fecha"
          render={(fecha: GastoRow["fecha"]) => dayjs(fecha).format("DD/MM/YYYY")}
        />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          render={(monto: GastoRow["monto"]) => formatMonto(monto)}
        />
        <Table.Column title="Proveedor" dataIndex="proveedor" render={(proveedor: GastoRow["proveedor"]) => proveedor.nombre} />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoGasto: GastoRow["estado"]) => (
            <Tag color={GASTO_ESTADO_COLOR[estadoGasto]}>{GASTO_ESTADO_LABEL_PROPIETARIO[estadoGasto]}</Tag>
          )}
        />
        <Table.Column
          title="Fecha de aprobación"
          dataIndex="fecha_aprobacion"
          render={(fechaAprobacion: GastoRow["fecha_aprobacion"]) =>
            fechaAprobacion ? dayjs(fechaAprobacion).format("DD/MM/YYYY HH:mm") : "—"
          }
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: GastoRow) =>
            record.estado === "SOLICITADO" ? (
              <Space>
                <Popconfirm title="¿Aprobar este gasto?" okText="Aprobar" cancelText="Cancelar" onConfirm={() => aprobar(record)}>
                  <Button size="small" type="primary">
                    Aprobar
                  </Button>
                </Popconfirm>
                <Button size="small" danger onClick={() => setRechazando(record)}>
                  Rechazar
                </Button>
              </Space>
            ) : (
              "—"
            )
          }
        />
      </Table>
      <Modal
        title="Rechazar gasto"
        open={rechazando !== null}
        onCancel={() => {
          setRechazando(null);
          formRechazo.resetFields();
        }}
        onOk={() => formRechazo.submit()}
        okText="Rechazar"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
      >
        <Form form={formRechazo} layout="vertical" onFinish={rechazar}>
          <Form.Item label="Motivo del rechazo" name="motivo_rechazo" rules={[{ required: true, message: "Ingresá un motivo" }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
