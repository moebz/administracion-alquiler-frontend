import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Switch } from "antd";

export const EdificioCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: comodidadesSelectProps } = useSelect({
    resource: "comodidades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" initialValues={{ tiene_estacionamiento: false }}>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Dirección" name="direccion" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Superficie (m²)" name="superficie_m2">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Tiene estacionamiento" name="tiene_estacionamiento" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Comodidades" name="comodidades">
          <Select {...comodidadesSelectProps} mode="multiple" />
        </Form.Item>
      </Form>
    </Create>
  );
};
