import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { capitalize } from "../../utils/strings";

// A diferencia de UserEdit/ProveedorEdit, acá documento/tipo de documento SÍ
// se editan: este es el ABM canónico de la persona.
export const PersonaEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const { selectProps: tipoDocumentoSelectProps } = useSelect({
    resource: "tipos-documento",
    optionLabel: "nombre",
    optionValue: "id",
    defaultValue: formProps.initialValues?.tipo_documento_id,
  });

  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: (role: { name: string }) => capitalize(role.name),
    optionValue: "name",
    defaultValue: formProps.initialValues?.roles,
  });

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar persona">
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
        {/* El backend devuelve `roles` como array de strings directamente
            (no [{id, nombre}]) — a diferencia de comodidades/rubros, acá no
            hace falta mapear initialValues a ids (ver CLAUDE.md). */}
        <Form.Item label="Roles" name="roles">
          <Select mode="multiple" {...roleSelectProps} placeholder="Sin rol" />
        </Form.Item>
      </Form>
    </Edit>
  );
};
