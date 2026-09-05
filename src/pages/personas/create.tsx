import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { capitalize } from "../../utils/strings";

export const PersonaCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: tipoDocumentoSelectProps } = useSelect({
    resource: "tipos-documento",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: (role: { name: string }) => capitalize(role.name),
    optionValue: "name",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear persona">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Tipo de documento" name="tipo_documento_id" rules={[{ required: true }]}>
          <Select {...tipoDocumentoSelectProps} />
        </Form.Item>
        <Form.Item label="Documento" name="documento" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Teléfono" name="telefono">
          <Input />
        </Form.Item>
        <Form.Item label="Email de contacto" name="email_contacto">
          <Input />
        </Form.Item>
        <Form.Item label="Roles" name="roles">
          <Select mode="multiple" {...roleSelectProps} placeholder="Sin rol" />
        </Form.Item>
      </Form>
    </Create>
  );
};
