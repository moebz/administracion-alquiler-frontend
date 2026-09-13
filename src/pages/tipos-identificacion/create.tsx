import { Create, useForm } from "@refinedev/antd";
import { Col, Form, Input, Row } from "antd";

export const TipoIdentificacionCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear tipo de identificación">
      <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Código" name="codigo" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Código SIFEN" name="codigo_sifen">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
