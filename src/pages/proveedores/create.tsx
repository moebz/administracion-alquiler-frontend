import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Select } from "antd";
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
      <Form {...formProps} layout="vertical">
        <PersonaBuscador
          form={form}
          conflictField="ya_es_proveedor"
          conflictMessage="Esta persona ya es proveedor."
        />
        <Form.Item label="Rubros" name="rubros" rules={[{ required: true }]}>
          <Select mode="multiple" {...rubroSelectProps} />
        </Form.Item>
      </Form>
    </Create>
  );
};
