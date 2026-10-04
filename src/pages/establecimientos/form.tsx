import { ClusterOutlined } from "@ant-design/icons";
import { Col, Form, Input } from "antd";
import type { FormProps } from "antd";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";

type EstablecimientoFormProps = {
  formProps: FormProps;
  codigoEditable: boolean;
};

export const EstablecimientoForm = ({ formProps, codigoEditable }: EstablecimientoFormProps) => (
  <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
    <SectionDivider icon={<ClusterOutlined />} style={{ marginTop: 0 }}>
      Datos generales
    </SectionDivider>
    <SectionRow>
      <Col xs={24} md={12}>
        <Form.Item
          label="Código"
          name="codigo"
          rules={[{ required: true }, { pattern: /^\d{3}$/, message: "Tienen que ser 3 dígitos, ej. 001" }]}
          extra={codigoEditable ? "No se puede cambiar una vez creado." : undefined}
        >
          <Input disabled={!codigoEditable} maxLength={3} placeholder="001" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }, { max: 100 }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item label="Dirección" name="direccion" rules={[{ max: 255 }]}>
          <Input />
        </Form.Item>
      </Col>
    </SectionRow>
  </Form>
);
