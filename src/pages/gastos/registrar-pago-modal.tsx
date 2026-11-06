import { useState } from "react";
import { useSelect } from "@refinedev/antd";
import { useList, useOne, usePermissions } from "@refinedev/core";
import { App, Button, Col, DatePicker, Descriptions, Flex, Form, Input, Modal, Row, Select, Space, Table, Typography } from "antd";
import { BankOutlined, CalendarOutlined, DeleteOutlined, FileTextOutlined, PlusOutlined, WalletOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { MontoInput } from "../../components/monto-input";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { formatMonto } from "../../utils/monto";
import type { CompraRow } from "../compras/types";
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
// `notas` guarda, por id de NC, cuánto de su saldo a favor se usa en este pago.
type Valores = { fecha: string; concepto?: string; valores: Valor[]; notas?: Record<string, number | null | undefined> };

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
  // Las cuotas de las ND registradas se pagan junto con las de la factura, por vencimiento.
  const cuotasDeNd = (compra?.notas ?? [])
    .filter((nota) => nota.tipo === "NOTA_DEBITO" && nota.estado === "REGISTRADO")
    .flatMap((nota) => nota.cuotas);
  const cuotasPendientes = [...(compra?.cuotas ?? []), ...cuotasDeNd]
    .filter((cuota) => Number(cuota.saldo) > 0)
    .sort((a, b) => dayjs(a.fecha_vencimiento).diff(dayjs(b.fecha_vencimiento)));
  const proximaCuota = cuotasPendientes[0];
  // Lo que se le debe al proveedor por la factura y sus ND.
  const saldoAlProveedor = Number(compra?.saldo_al_proveedor ?? compra?.saldo ?? 0);

  // El saldo a favor solo se ofrece a quien puede aplicarlo (sin pagos.aplicar el backend responde 403).
  const { data: permissions } = usePermissions<string[]>({});
  const saldosAFavor = permissions?.includes("pagos.aplicar") ? gasto.saldos_a_favor_proveedor : [];

  const notas = Form.useWatch("notas", form) as Valores["notas"];
  const sumaNotas = Object.values(notas ?? {}).reduce<number>((acum, monto) => acum + (Number(monto) || 0), 0);
  // Si el saldo a favor cubre todo lo que se debe, no hace falta pedir medios de pago.
  const creditoCubreTodo = sumaNotas > 0 && sumaNotas >= saldoAlProveedor;

  // Pone en el primer medio de pago lo que falta después de usar el saldo a favor.
  const setMontoPrimerMedio = (montoAPagar: number) => {
    const monto = Math.max(0, montoAPagar - sumaNotas);
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
  // Lo que se paga en total: el saldo a favor más la plata (que se ignora si el saldo a favor ya cubre todo).
  const totalAPagar = (creditoCubreTodo ? 0 : sumaValores) + sumaNotas;

  const registrar = async (values: Valores) => {
    // Mandar solo las NC con un importe, y los valores solo si el saldo a favor no alcanza para todo.
    const notasCredito = saldosAFavor
      .map((nota) => ({ id: nota.id, monto: Number(values.notas?.[String(nota.id)]) || 0 }))
      .filter((nota) => nota.monto > 0);
    setGuardando(true);
    const response = await kyInstance.post(`gastos/${gasto.id}/pagos`, {
      json: {
        fecha: dayjs(values.fecha).format("YYYY-MM-DD"),
        concepto: values.concepto,
        valores: creditoCubreTodo ? undefined : values.valores,
        notas_credito: notasCredito.length > 0 ? notasCredito : undefined,
      },
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
        <Descriptions.Item label="Saldo de la factura">{formatMonto(saldoAlProveedor)}</Descriptions.Item>
      </Descriptions>

      <SectionDivider icon={<CalendarOutlined />}>Cuotas pendientes</SectionDivider>
      <Table dataSource={cuotasPendientes} rowKey="id" pagination={false} size="small" style={{ marginBottom: 12 }}>
        <Table.Column title="N°" dataIndex="numero_cuota" />
        <Table.Column
          title="Vencimiento"
          dataIndex="fecha_vencimiento"
          render={(fecha: string) => dayjs(fecha).format("DD/MM/YYYY")}
        />
        <Table.Column
          title="Saldo"
          dataIndex="saldo"
          align="right"
          render={(saldo: number | string) => formatMonto(saldo)}
        />
      </Table>
      <Space>
        <Button disabled={!proximaCuota} onClick={() => proximaCuota && setMontoPrimerMedio(Number(proximaCuota.saldo))}>
          Pagar siguiente cuota
        </Button>
        <Button disabled={!compra} onClick={() => setMontoPrimerMedio(saldoAlProveedor)}>
          Pagar el saldo completo
        </Button>
      </Space>

      <Form form={form} layout="vertical" onFinish={registrar} initialValues={{ fecha: dayjs() }}>
        <SectionDivider icon={<FileTextOutlined />}>Datos del pago</SectionDivider>
        <SectionRow gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="Concepto" name="concepto">
              <Input placeholder="Opcional" maxLength={255} />
            </Form.Item>
          </Col>
        </SectionRow>

        {saldosAFavor.length > 0 && (
          <>
            <SectionDivider icon={<BankOutlined />}>Saldo a favor con el proveedor</SectionDivider>
            <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 8 }}>
              {saldosAFavor.map((nota) => (
                <Row key={nota.id} gutter={[8, 8]} align="middle">
                  <Col xs={24} md={12}>
                    <Typography.Text>NC {nota.numero}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">
                      {nota.gasto ? `${nota.gasto.unidad} · ${nota.gasto.descripcion} · ` : ""}
                      a favor {formatMonto(nota.saldo_a_favor)}
                    </Typography.Text>
                  </Col>
                  <Col xs={16} md={8}>
                    <Form.Item name={["notas", String(nota.id)]} noStyle>
                      <MontoInput style={{ width: "100%" }} max={Number(nota.saldo_a_favor)} />
                    </Form.Item>
                  </Col>
                  <Col xs={8} md={4}>
                    <Button
                      onClick={() =>
                        form.setFieldValue(
                          ["notas", String(nota.id)],
                          Math.min(Number(nota.saldo_a_favor), Math.max(0, saldoAlProveedor - (sumaNotas - (Number(notas?.[String(nota.id)]) || 0)))),
                        )
                      }
                    >
                      Todo
                    </Button>
                  </Col>
                </Row>
              ))}
            </Space>
            <Typography.Text type="secondary">Se usa primero el saldo a favor y después los medios de pago.</Typography.Text>
          </>
        )}

        {!creditoCubreTodo && (
          <>
            <SectionDivider icon={<WalletOutlined />}>Medios de pago</SectionDivider>
            <Form.List name="valores" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {fields.map((field) => {
                    const medioId = form.getFieldValue(["valores", field.name, "medio_pago_id"]);
                    const medio = (medioPagoQuery.data?.data ?? []).find((m) => m.id === medioId);

                    return (
                      <Row key={field.key} gutter={[8, 8]} align="middle">
                        <Col xs={24} md={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, "medio_pago_id"]}
                            rules={[{ required: true, message: "Medio" }]}
                            noStyle
                          >
                            <Select {...medioPagoSelectProps} options={mediosPagoOptions} placeholder="Medio" style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, "fondo_id"]}
                            rules={[{ required: true, message: "Fondo" }]}
                            noStyle
                          >
                            <Select {...fondoSelectProps} placeholder="Fondo" style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                          <Form.Item {...field} name={[field.name, "monto"]} rules={[{ required: true, message: "Monto" }]} noStyle>
                            <MontoInput style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={20} md={5}>
                          <Form.Item
                            {...field}
                            name={[field.name, "nro_comprobante"]}
                            rules={medio?.requiere_datos_bancarios ? [{ required: true, message: "Comprobante" }] : []}
                            noStyle
                          >
                            <Input placeholder="N° comprobante" style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={4} md={1}>
                          <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                        </Col>
                        {medio?.requiere_datos_bancarios && (
                          <Col xs={24} md={12}>
                            <Form.Item {...field} name={[field.name, "persona_cuenta_id"]} noStyle>
                              <Select
                                options={cuentaOptions}
                                placeholder="Cuenta del proveedor (opcional)"
                                allowClear
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                        )}
                      </Row>
                    );
                  })}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                    Agregar medio de pago
                  </Button>
                </Space>
              )}
            </Form.List>
          </>
        )}

        <Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Total a pagar:</Typography.Text>
          <Typography.Text strong type={totalAPagar > saldoAlProveedor ? "danger" : undefined}>
            {formatMonto(totalAPagar)}
          </Typography.Text>
          <Typography.Text type="secondary">de {formatMonto(saldoAlProveedor)}</Typography.Text>
        </Flex>
      </Form>
    </Modal>
  );
};
