import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const RoleCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear rol">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
