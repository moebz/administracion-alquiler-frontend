import { useSelect } from "@refinedev/antd";
import { Button, Col, Form, Input, Row, Select, Space, type FormInstance } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { MontoInput } from "../../components/monto-input";
import type { MedioPagoRow } from "../medios-pago/types";

export type ValorFormulario = {
  medio_pago_id: number;
  fondo_id: number;
  monto: number;
  persona_cuenta_id?: number;
  nro_comprobante?: string;
};

type Props = {
  // Formulario que contiene el campo `valores`.
  form: FormInstance;
  // Cuentas bancarias de la persona que cobra, para los medios que piden datos bancarios.
  cuentaOptions: { label: string; value: number }[];
  cuentaPlaceholder: string;
};

// Lista de medios de pago de un pago a una persona: medio, fondo, monto y, según el medio, comprobante y cuenta.
// La comparten el pago de un gasto y la transferencia al propietario.
export const ValoresFormList = ({ form, cuentaOptions, cuentaPlaceholder }: Props) => {
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

  return (
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
                      <Select options={cuentaOptions} placeholder={cuentaPlaceholder} allowClear style={{ width: "100%" }} />
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
  );
};
