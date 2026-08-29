import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Switch } from "antd";

export const EdificioEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const { selectProps: comodidadesSelectProps } = useSelect({
    resource: "comodidades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.comodidades?.map(
      (comodidad: { id: number }) => comodidad.id,
    ),
  });

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{
          ...formProps.initialValues,
          comodidades: formProps.initialValues?.comodidades?.map((comodidad: { id: number }) => comodidad.id),
        }}
      >
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
    </Edit>
  );
};
