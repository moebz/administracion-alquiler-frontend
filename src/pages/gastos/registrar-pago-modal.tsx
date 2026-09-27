import { useState } from "react";
import { useSelect } from "@refinedev/antd";
import { useList, useOne } from "@refinedev/core";
import { App, Button, DatePicker, Descriptions, Form, Input, Modal, Select, Space, Table, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { MontoInput } from "../../components/monto-input";
import { formatMonto } from "../../utils/monto";
import type { CompraCuotaRow, CompraRow } from "../compras/types";
import type { MedioPagoRow } from "../medios-pago/types";
import type { PersonaCuentaBancariaRow } from "../personas/types";
import type { GastoRow } from "./types";

type Valor = {
  medio_pago_id: number;
  fondo_id: number;
  monto: number;
  persona_cuenta_id?: number;
  nro_comprobante?: string;
};
type Valores = { fecha: string; concepto?: string; valores: Valor[] };

export const RegistrarPagoModal = ({
  gasto,
  onClose,
  onSuccess,
}: {
  gasto: GastoRow;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<Valores>();

  const { result: compra } = useOne<CompraRow>({
    resource: "compras",
    id: gasto.documento_compra_id ?? "",
    queryOptions: { enabled: !!gasto.documento_compra_id },
  });
  const cuotasPendientes = (compra?.cuotas ?? [])
    .filter((cuota) => Number(cuota.saldo) > 0)
    .sort((a, b) => dayjs(a.fecha_vencimiento).diff(dayjs(b.fecha_vencimiento)));
  const proximaCuota = cuotasPendientes[0] as CompraCuotaRow | undefined;

  const setMontoPrimerMedio = (monto: number) => {
    const actuales = (form.getFieldValue("valores") as Valor[] | undefined) ?? [];
    if (actuales.length === 0) {
      form.setFieldValue("valores", [{ monto }]);
      return;
    }
    form.setFieldValue("valores", actuales.map((valor, index) => (index === 0 ? { ...valor, monto } : valor)));
  };

  const { selectProps: medioPagoSelectProps, query: medioPagoQuery } = useSelect<MedioPagoRow>({
    resource: "medios-pago",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });
  // Sin cheques todavía (ver ARQUITECTURA.md, "Compras y pagos a proveedores").
  const mediosPagoOptions = (medioPagoQuery.data?.data ?? [])
    .filter((medio) => !medio.codigo.startsWith("CHEQUE"))
    .map((medio) => ({ label: medio.nombre, value: medio.id }));

  const { selectProps: fondoSelectProps } = useSelect({
    resource: "fondos",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const { result: cuentas } = useList<PersonaCuentaBancariaRow>({
    resource: `personas/${gasto.proveedor_id}/cuentas-bancarias`,
    pagination: { mode: "off" },
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });
  const cuentaOptions = (cuentas?.data ?? []).map((cuenta) => ({
    label: `${cuenta.banco.nombre} - ${cuenta.numero_cuenta}`,
    value: cuenta.id,
  }));

  const valores = Form.useWatch("valores", form) as Valor[] | undefined;
  const sumaValores = (valores ?? []).reduce((acum, valor) => acum + (Number(valor?.monto) || 0), 0);

  const registrar = async (values: Valores) => {
    setGuardando(true);
    const response = await kyInstance.post(`gastos/${gasto.id}/pagos`, {
      json: { ...values, fecha: dayjs(values.fecha).format("YYYY-MM-DD") },
    });
    setGuardando(false);

    if (response.ok) {
      message.success("Pago registrado.");
      onSuccess();
      return;
    }

    const body = await response.json<{ message?: string; errors?: Record<string, string[]> }>().catch(() => null);
    if (response.status === 422 && body?.errors) {
      form.setFields(
        Object.entries(body.errors).map(([name, errors]) => ({ name: name.split("."), errors })) as Parameters<
          typeof form.setFields
        >[0],
      );
      return;
    }
    message.error(await extractErrorMessage(response, "No se pudo registrar el pago."));
  };

  return (
    <Modal
      title="Registrar pago a proveedor"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Registrar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      width={720}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Gasto">{gasto.descripcion}</Descriptions.Item>
        <Descriptions.Item label="Proveedor">{gasto.proveedor.nombre}</Descriptions.Item>
        <Descriptions.Item label="Saldo de la factura">{formatMonto(compra?.saldo ?? 0)}</Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5}>Cuotas pendientes</Typography.Title>
      <Table
        dataSource={cuotasPendientes}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Table.Column title="N°" dataIndex="numero_cuota" />
        <Table.Column
          title="Vencimiento"
          dataIndex="fecha_vencimiento"
          render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")}
        />
        <Table.Column title="Saldo" dataIndex="saldo" render={(saldo: CompraCuotaRow["saldo"]) => formatMonto(saldo)} />
      </Table>

      <Space style={{ marginBottom: 16 }}>
        <Button disabled={!proximaCuota} onClick={() => proximaCuota && setMontoPrimerMedio(Number(proximaCuota.saldo))}>
          Pagar siguiente cuota
        </Button>
        <Button disabled={!compra} onClick={() => setMontoPrimerMedio(Number(compra?.saldo ?? 0))}>
          Pagar el saldo completo
        </Button>
      </Space>

      <Form form={form} layout="vertical" onFinish={registrar} initialValues={{ fecha: dayjs() }}>
        <Form.Item
          label="Fecha"
          name="fecha"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item label="Concepto" name="concepto">
          <Input placeholder="Opcional" maxLength={255} />
        </Form.Item>

        <Typography.Title level={5}>Medios de pago</Typography.Title>
        <Form.List name="valores" initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map((field) => {
                const medioId = form.getFieldValue(["valores", field.name, "medio_pago_id"]);
                const medio = (medioPagoQuery.data?.data ?? []).find((m) => m.id === medioId);

                return (
                  <Space key={field.key} align="baseline" wrap>
                    <Form.Item
                      {...field}
                      name={[field.name, "medio_pago_id"]}
                      rules={[{ required: true, message: "Medio" }]}
                      noStyle
                    >
                      <Select {...medioPagoSelectProps} options={mediosPagoOptions} placeholder="Medio" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "fondo_id"]}
                      rules={[{ required: true, message: "Fondo" }]}
                      noStyle
                    >
                      <Select {...fondoSelectProps} placeholder="Fondo" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, "monto"]} rules={[{ required: true, message: "Monto" }]} noStyle>
                      <MontoInput style={{ width: 160 }} />
                    </Form.Item>
                    {medio?.requiere_datos_bancarios && (
                      <Form.Item {...field} name={[field.name, "persona_cuenta_id"]} noStyle>
                        <Select
                          options={cuentaOptions}
                          placeholder="Cuenta del proveedor (opcional)"
                          allowClear
                          style={{ width: 200 }}
                        />
                      </Form.Item>
                    )}
                    <Form.Item
                      {...field}
                      name={[field.name, "nro_comprobante"]}
                      rules={medio?.requiere_datos_bancarios ? [{ required: true, message: "Comprobante" }] : []}
                      noStyle
                    >
                      <Input placeholder="N° comprobante" style={{ width: 140 }} />
                    </Form.Item>
                    <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                  </Space>
                );
              })}
              <Button icon={<PlusOutlined />} onClick={() => add()}>
                Agregar medio de pago
              </Button>
            </Space>
          )}
        </Form.List>

        <Typography.Text type={sumaValores > Number(compra?.saldo ?? 0) ? "danger" : "secondary"} style={{ display: "block", marginTop: 16 }}>
          Total a pagar: {formatMonto(sumaValores)} / Saldo de la factura: {formatMonto(compra?.saldo ?? 0)}
        </Typography.Text>
      </Form>
    </Modal>
  );
};
