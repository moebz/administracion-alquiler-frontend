import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";

export const BloqueEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const { selectProps: edificioSelectProps } = useSelect({
    resource: "edificios",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.edificio_id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar bloque">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Edificio" name="edificio_id" rules={[{ required: true }]}>
          <Select {...edificioSelectProps} />
        </Form.Item>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input placeholder="Bloque A, Ala Norte, Torre 1..." />
        </Form.Item>
        <Form.Item label="Capacidad de departamentos" name="capacidad_dptos">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Año de construcción" name="anio_construccion">
          <InputNumber min={1800} max={new Date().getFullYear()} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
