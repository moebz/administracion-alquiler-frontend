import { useState } from "react";
import { EditButton, List, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import {
  GASTO_ESTADO_COLOR,
  GASTO_ESTADO_LABEL,
  GASTO_ESTADO_OPTIONS,
  GASTO_TIPO_LABEL,
  type GastoEstado,
  type GastoRow,
} from "./types";

export const GastoList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<GastoRow>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
  });
  const { message } = App.useApp();

  const [estado, setEstado] = useState<GastoEstado>();
  const [rechazando, setRechazando] = useState<GastoRow | null>(null);
  const [formRechazo] = Form.useForm<{ motivo_rechazo: string }>();

  // Mismo criterio que pages/contratos-alquiler/list.tsx: recalcula el array completo de filtros en cada cambio.
  const applyFilters = (nextEstado: GastoEstado | undefined) => {
    setEstado(nextEstado);

    const filters: CrudFilter[] = [];
    if (nextEstado) {
      filters.push({ field: "estado", operator: "eq", value: nextEstado });
    }
    setFilters(filters, "replace");
  };

  const aprobar = async (record: GastoRow) => {
    const response = await kyInstance.patch(`gastos/${record.id}/aprobar`, {
      json: { aprobado_por: "ADMINISTRADORA" },
    });
    if (response.ok) {
      message.success("Gasto aprobado.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo aprobar el gasto."));
    }
  };

  const rechazar = async (values: { motivo_rechazo: string }) => {
    if (!rechazando) return;

    const response = await kyInstance.patch(`gastos/${rechazando.id}/rechazar`, { json: values });
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
    <List title="Gastos" headerButtons={() => null}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Space>
          <span>Estado</span>
          <Select
            style={{ minWidth: 160 }}
            allowClear
            placeholder="Todos"
            options={GASTO_ESTADO_OPTIONS}
            value={estado}
            onChange={applyFilters}
          />
        </Space>
      </Space>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Unidad"
          dataIndex="unidad"
          render={(unidad: GastoRow["unidad"]) => `${unidad.bloque.edificio.nombre} - ${unidad.bloque.nombre} - ${unidad.numero}`}
        />
        <Table.Column title="Tipo" dataIndex="tipo" render={(tipo: GastoRow["tipo"]) => GASTO_TIPO_LABEL[tipo]} />
        <Table.Column title="Descripción" dataIndex="descripcion" />
        <Table.Column dataIndex="fecha" title="Fecha" />
        <Table.Column title="Período" dataIndex="periodo" render={(periodo: string | null) => periodo ?? "—"} />
        <Table.Column
          title="Monto"
          dataIndex="monto"
          render={(monto: number) => monto.toLocaleString("es-PY", { style: "currency", currency: "PYG" })}
        />
        <Table.Column title="Proveedor" dataIndex="proveedor" render={(proveedor: GastoRow["proveedor"]) => proveedor.nombre}
        />
        <Table.Column
          title="Estado"
          dataIndex="estado"
          render={(estadoGasto: GastoRow["estado"]) => (
            <Tag color={GASTO_ESTADO_COLOR[estadoGasto]}>{GASTO_ESTADO_LABEL[estadoGasto]}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: GastoRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              {record.estado === "SOLICITADO" && (
                <>
                  <Popconfirm title="¿Aprobar este gasto?" okText="Aprobar" cancelText="Cancelar" onConfirm={() => aprobar(record)}>
                    <Button size="small" type="primary">
                      Aprobar
                    </Button>
                  </Popconfirm>
                  <Button size="small" danger onClick={() => setRechazando(record)}>
                    Rechazar
                  </Button>
                </>
              )}
            </Space>
          )}
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
