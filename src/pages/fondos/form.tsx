import { useEffect } from "react";
import { useSelect } from "@refinedev/antd";
import { BankOutlined, WalletOutlined } from "@ant-design/icons";
import { Col, Form, Input, Select } from "antd";
import type { FormProps } from "antd";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { FONDO_TIPO_OPTIONS, TIPO_CUENTA_OPTIONS } from "./types";

const FORM_MAX_WIDTH = 720;
const LABEL_COL = { xs: { span: 24 }, sm: { flex: "140px" } };
const WRAPPER_COL = { xs: { span: 24 }, sm: { flex: 1 } };

// Form compartido entre Crear y Editar (pages/fondos/create.tsx y edit.tsx).
export const FondoForm = ({ formProps }: { formProps: FormProps }) => {
  const { selectProps: bancoSelectProps } = useSelect({
    resource: "bancos",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.banco_id,
  });

  const tipo = Form.useWatch("tipo", formProps.form);
  const esBanco = tipo === "BANCO";

  useEffect(() => {
    if (esBanco) return;
    // Los datos de cuenta no se muestran para CAJA/OTRO — si quedaron
    // cargados de un tipo anterior, se limpian para no mandarlos igual.
    formProps.form?.setFieldsValue({
      banco_id: undefined,
      tipo_cuenta: undefined,
      numero_cuenta: undefined,
      titular: undefined,
    });
  }, [esBanco, formProps.form]);

  return (
    <Form
      {...formProps}
      layout="horizontal"
      labelCol={LABEL_COL}
      wrapperCol={WRAPPER_COL}
      labelAlign="left"
      labelWrap
      style={{ maxWidth: FORM_MAX_WIDTH }}
    >
      <SectionDivider icon={<WalletOutlined />} style={{ marginTop: 0 }}>
        Datos generales
      </SectionDivider>
      <SectionRow>
        <Col xs={24} md={12}>
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
            <Input placeholder="Ej.: Caja chica" maxLength={100} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Tipo" name="tipo" rules={[{ required: true }]}>
            <Select options={FONDO_TIPO_OPTIONS} />
          </Form.Item>
        </Col>
      </SectionRow>

      {esBanco && (
        <>
          <SectionDivider icon={<BankOutlined />}>Datos de la cuenta</SectionDivider>
          <SectionRow>
            <Col xs={24} md={12}>
              <Form.Item label="Banco" name="banco_id" rules={[{ required: true, message: "Elegí un banco" }]}>
                <Select {...bancoSelectProps} placeholder="Elegí un banco" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tipo de cuenta"
                name="tipo_cuenta"
                rules={[{ required: true, message: "Elegí el tipo de cuenta" }]}
              >
                <Select options={TIPO_CUENTA_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Número de cuenta"
                name="numero_cuenta"
                rules={[{ required: true, message: "Ingresá el número de cuenta" }]}
              >
                <Input maxLength={50} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Titular"
                name="titular"
                rules={[{ required: true, message: "Ingresá el titular de la cuenta" }]}
              >
                <Input maxLength={150} />
              </Form.Item>
            </Col>
          </SectionRow>
        </>
      )}
    </Form>
  );
};
