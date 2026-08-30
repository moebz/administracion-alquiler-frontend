import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

// Solo el email de login: roles y datos de persona se editan desde el ABM
// de Personas (ver pages/personas), no desde acá.
export const UserEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar usuario">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
