import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { ROLE_OPTIONS } from "../../providers/roles";

// Mismo criterio que create.tsx: sin campo de contraseña.
export const UserEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Roles" name="roles" rules={[{ required: true }]}>
          <Select mode="multiple" options={ROLE_OPTIONS} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
