import { useSelect } from "@refinedev/antd";
import { Col, Form, Input, InputNumber, Row, Select } from "antd";
import type { FormProps } from "antd";

type BloqueFormProps = {
  formProps: FormProps;
};

// Form compartido entre Crear y Editar (pages/bloques/create.tsx y
// edit.tsx): mismos campos, la única diferencia es el prellenado de
// initialValues (ver PersonaForm en pages/personas/form.tsx, mismo patrón).
export const BloqueForm = ({ formProps }: BloqueFormProps) => {
  const { selectProps: edificioSelectProps } = useSelect({
    resource: "edificios",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.edificio_id,
  });

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Edificio" name="edificio_id" rules={[{ required: true }]}>
            <Select {...edificioSelectProps} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
            <Input placeholder="Bloque A, Ala Norte, Torre 1..." />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Capacidad de departamentos" name="capacidad_dptos">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Año de construcción" name="anio_construccion">
            <InputNumber min={1800} max={new Date().getFullYear()} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
