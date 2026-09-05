import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const RoleEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar rol">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
