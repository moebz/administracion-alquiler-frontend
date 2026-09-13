import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const RubroEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar rubro">
      <Form {...formProps} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
