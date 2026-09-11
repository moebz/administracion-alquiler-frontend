import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { capitalize } from "../../utils/strings";
import { TIPO_PERSONA_OPTIONS } from "./types";

// A diferencia de UserEdit/ProveedorEdit, acá documento/tipo de identificación
// SÍ se editan: este es el ABM canónico de la persona.
export const PersonaEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const { selectProps: tipoIdentificacionSelectProps } = useSelect({
    resource: "tipos-identificacion",
    optionLabel: "nombre",
    optionValue: "id",
    defaultValue: formProps.initialValues?.tipo_identificacion_id,
  });

  const { selectProps: ciudadSelectProps } = useSelect({
    resource: "ciudades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    defaultValue: formProps.initialValues?.ciudad_id,
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
        <Form.Item label="Tipo de identificación" name="tipo_identificacion_id" rules={[{ required: true }]}>
          <Select {...tipoIdentificacionSelectProps} />
        </Form.Item>
        <Form.Item label="Documento" name="documento" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {/* Solo aplica si el tipo de identificación es R.U.C. (ver UpdatePersonaRequest). */}
        <Form.Item label="DV" name="dv">
          <Input style={{ maxWidth: 80 }} />
        </Form.Item>
        <Form.Item label="Tipo de persona" name="tipo_persona" rules={[{ required: true }]}>
          <Select options={TIPO_PERSONA_OPTIONS} />
        </Form.Item>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Dirección" name="direccion">
          <Input />
        </Form.Item>
        <Form.Item label="Ciudad" name="ciudad_id">
          <Select {...ciudadSelectProps} allowClear />
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
