import { Create, useForm, useSelect } from "@refinedev/antd";
import { Divider, Form, Select } from "antd";
import { PersonaBuscador } from "../../components/persona-buscador";

export const ProveedorCreate = () => {
  const { formProps, saveButtonProps, form } = useForm({});

  const { selectProps: rubroSelectProps } = useSelect({
    resource: "rubros",
    optionLabel: "nombre",
    optionValue: "id",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear proveedor">
      <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
        <PersonaBuscador form={form} />
        <Divider orientation="left" orientationMargin={0}>
          Rubros
        </Divider>
        <Form.Item label="Rubros" name="rubros" rules={[{ required: true }]}>
          <Select mode="multiple" {...rubroSelectProps} />
        </Form.Item>
      </Form>
    </Create>
  );
};
