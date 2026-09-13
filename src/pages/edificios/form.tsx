import { useSelect } from "@refinedev/antd";
import { Col, Divider, Form, Input, InputNumber, Row, Select, Switch } from "antd";
import type { FormProps } from "antd";

type EdificioFormProps = {
  formProps: FormProps;
};

// Form compartido entre Crear y Editar (pages/edificios/create.tsx y
// edit.tsx): mismos campos y selects. El mapeo de `comodidades` (de
// [{id, nombre}] a ids) para precargar el form en Editar queda en
// edificios/edit.tsx, antes de llegar acá (ver GastoForm en
// pages/gastos/form.tsx, mismo patrón).
export const EdificioForm = ({ formProps }: EdificioFormProps) => {
  const { selectProps: ciudadSelectProps } = useSelect({
    resource: "ciudades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.ciudad_id,
  });

  const { selectProps: comodidadesSelectProps } = useSelect({
    resource: "comodidades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.comodidades,
  });

  const { selectProps: administracionSelectProps } = useSelect<{ id: number; nombre: string }>({
    resource: "personas",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.administracion_id,
  });

  return (
    <Form {...formProps} layout="vertical" style={{ maxWidth: 960 }}>
      <Divider orientation="left" orientationMargin={0} style={{ marginTop: 0 }}>
        Datos generales
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Ciudad" name="ciudad_id" rules={[{ required: true }]}>
            <Select {...ciudadSelectProps} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Dirección" name="direccion" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0}>
        Administración
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Administración" name="administracion_id">
            <Select {...administracionSelectProps} allowClear placeholder="Sin administración asignada" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0}>
        Características
      </Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Superficie (m²)" name="superficie_m2">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Tiene estacionamiento" name="tiene_estacionamiento" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Comodidades" name="comodidades">
            <Select {...comodidadesSelectProps} mode="multiple" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
