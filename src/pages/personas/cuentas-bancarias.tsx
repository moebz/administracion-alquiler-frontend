import { useState } from "react";
import { useSelect, useTable } from "@refinedev/antd";
import { usePermissions } from "@refinedev/core";
import { CheckCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button, Card, Checkbox, Form, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { TIPO_CUENTA_LABEL, TIPO_CUENTA_OPTIONS, type TipoCuenta } from "../fondos/types";
import type { PersonaCuentaBancariaRow } from "./types";

const PERMISO_GESTIONAR = "personas.cuentas_bancarias.gestionar";

type NuevaCuenta = {
  banco_id: number;
  tipo_cuenta: TipoCuenta;
  numero_cuenta: string;
  titular: string;
};

export const PersonaCuentasBancarias = ({
  personaId,
  personaNombre,
}: {
  personaId: number;
  personaNombre: string;
}) => {
  const { tableProps, tableQuery, filters, setFilters } = useTable<PersonaCuentaBancariaRow>({
    resource: `personas/${personaId}/cuentas-bancarias`,
    pagination: { mode: "off" },
    filters: { initial: [{ field: "is_active", operator: "eq", value: true }] },
  });
  const { message, modal } = App.useApp();
  const { data: permissions } = usePermissions<string[]>({});
  const puedeGestionar = permissions?.includes(PERMISO_GESTIONAR) ?? false;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [esTitular, setEsTitular] = useState(false);
  const [form] = Form.useForm<NuevaCuenta>();

  const { selectProps: bancoSelectProps } = useSelect({
    resource: "bancos",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const showInactive = !filters.some((filter) => "field" in filter && filter.field === "is_active");
  const toggleShowInactive = (checked: boolean) =>
    setFilters(checked ? [] : [{ field: "is_active", operator: "eq", value: true }], "replace");

  const agregar = async (values: NuevaCuenta) => {
    setGuardando(true);
    const response = await kyInstance.post(`personas/${personaId}/cuentas-bancarias`, { json: values });
    setGuardando(false);

    if (response.ok) {
      message.success("Cuenta bancaria agregada.");
      setModalAbierto(false);
      tableQuery.refetch();
      return;
    }

    const body = await response
      .json<{ message?: string; errors?: Record<string, string[]> }>()
      .catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({ name: name as keyof NuevaCuenta, errors })),
      );
      return;
    }
    message.error(body?.message ?? "No se pudo agregar la cuenta bancaria.");
  };

  const toggleActive = async (record: PersonaCuentaBancariaRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`cuentas-bancarias/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Cuenta bancaria desactivada." : "Cuenta bancaria activada.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <>
      <Card
        title="Cuentas bancarias"
        size="small"
        extra={
          <Space size="middle" wrap>
            <ActiveFilterSwitch checked={showInactive} onChange={toggleShowInactive} />
            {puedeGestionar && (
              <Button icon={<PlusOutlined />} onClick={() => setModalAbierto(true)}>
                Agregar cuenta
              </Button>
            )}
          </Space>
        }
      >
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Las cuentas se guardan al instante, sin usar el botón Guardar. No se editan: si hay un error, se
          desactiva y se carga una nueva.
        </Typography.Text>
        <Table {...tableProps} rowKey="id" size="small" pagination={false}>
          <Table.Column dataIndex={["banco", "nombre"]} title="Banco" />
          <Table.Column
            dataIndex="tipo_cuenta"
            title="Tipo"
            render={(tipo: TipoCuenta) => TIPO_CUENTA_LABEL[tipo]}
          />
          <Table.Column dataIndex="numero_cuenta" title="Número de cuenta" />
          <Table.Column dataIndex="titular" title="Titular" />
          <Table.Column
            title="Estado"
            dataIndex="is_active"
            render={(isActive: boolean, record: PersonaCuentaBancariaRow) => (
              <Space size={4} wrap>
                <Tag color={isActive ? "green" : "red"}>{isActive ? "Activa" : "Inactiva"}</Tag>
                {puedeGestionar && (
                  <Tooltip title={isActive ? "Desactivar cuenta bancaria" : "Activar cuenta bancaria"}>
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
                          title: "¿Desactivar esta cuenta bancaria?",
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
      </Card>
      <Modal
        title="Agregar cuenta bancaria"
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        afterClose={() => {
          form.resetFields();
          setEsTitular(false);
        }}
        onOk={() => form.submit()}
        okText="Agregar"
        cancelText="Cancelar"
        confirmLoading={guardando}
      >
        <Form form={form} layout="vertical" onFinish={agregar}>
          <Form.Item label="Banco" name="banco_id" rules={[{ required: true }]}>
            <Select {...bancoSelectProps} />
          </Form.Item>
          <Form.Item label="Tipo de cuenta" name="tipo_cuenta" rules={[{ required: true }]}>
            <Select options={TIPO_CUENTA_OPTIONS} />
          </Form.Item>
          <Form.Item label="Número de cuenta" name="numero_cuenta" rules={[{ required: true }, { max: 50 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Titular" required>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Checkbox
                checked={esTitular}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEsTitular(checked);
                  form.setFieldValue("titular", checked ? personaNombre : "");
                }}
              >
                Es la misma persona
              </Checkbox>
              {!esTitular && (
                <Form.Item name="titular" noStyle rules={[{ required: true }, { max: 150 }]}>
                  <Input />
                </Form.Item>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
