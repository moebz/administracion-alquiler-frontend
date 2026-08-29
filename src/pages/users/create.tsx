import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { PersonaBuscador } from "../../components/persona-buscador";
import { ROLE_OPTIONS } from "../../providers/roles";

// Sin campo de contraseña, a propósito: el admin nunca la escribe ni la
// conoce (ver ARQUITECTURA.md, "Alta de usuarios") — se dispara una invitación
// por mail al crear.
export const UserCreate = () => {
  const { formProps, saveButtonProps, form } = useForm({
    successNotification: () => ({
      type: "success",
      message: "Usuario creado",
      description: "Se le envió una invitación por mail para elegir su contraseña.",
    }),
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <PersonaBuscador
          form={form}
          conflictField="ya_es_usuario"
          conflictMessage="Esta persona ya es usuario."
        />
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Roles" name="roles" rules={[{ required: true }]}>
          <Select mode="multiple" options={ROLE_OPTIONS} />
        </Form.Item>
      </Form>
    </Create>
  );
};
