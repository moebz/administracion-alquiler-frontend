import { Edit, useForm } from "@refinedev/antd";
import { Col, Form, Input, Row } from "antd";

// Sin campo `codigo`: es de solo lectura una vez creado, la lógica de
// negocio cuelga de él (ver ARQUITECTURA.md, backend UpdateTipoIdentificacionRequest).
export const TipoIdentificacionEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar tipo de identificación">
      <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Código SIFEN" name="codigo_sifen">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
