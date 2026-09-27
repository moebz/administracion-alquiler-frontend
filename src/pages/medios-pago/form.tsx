import { BankOutlined, TagOutlined } from "@ant-design/icons";
import { Col, Form, Input, Switch } from "antd";
import type { FormProps } from "antd";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";

type MedioPagoFormProps = {
  formProps: FormProps;
  codigoEditable: boolean;
};

export const MedioPagoForm = ({ formProps, codigoEditable }: MedioPagoFormProps) => (
  <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
    <SectionDivider icon={<TagOutlined />}>Datos generales</SectionDivider>
    <SectionRow>
      <Col xs={24} md={12}>
        <Form.Item
          label="Código"
          name="codigo"
          rules={[{ required: true }, { max: 20 }]}
          extra={codigoEditable ? "No se puede cambiar una vez creado." : undefined}
        >
          <Input disabled={!codigoEditable} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }, { max: 50 }]}>
          <Input />
        </Form.Item>
      </Col>
    </SectionRow>

    <SectionDivider icon={<BankOutlined />}>Datos bancarios</SectionDivider>
    <SectionRow>
      <Col xs={24}>
        <Form.Item
          label="Requiere datos bancarios"
          name="requiere_datos_bancarios"
          valuePropName="checked"
          extra="Activado, los cobros y pagos con este medio exigen elegir una cuenta bancaria de la persona."
        >
          <Switch />
        </Form.Item>
      </Col>
    </SectionRow>
  </Form>
);
