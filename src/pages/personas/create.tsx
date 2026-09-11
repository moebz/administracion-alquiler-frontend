import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { capitalize } from "../../utils/strings";
import { TIPO_PERSONA_OPTIONS } from "./types";

export const PersonaCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: tipoIdentificacionSelectProps } = useSelect({
    resource: "tipos-identificacion",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const { selectProps: ciudadSelectProps } = useSelect({
    resource: "ciudades",
    optionLabel: "nombre",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
  });

  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: (role: { name: string }) => capitalize(role.name),
    optionValue: "name",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear persona">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Tipo de identificación" name="tipo_identificacion_id" rules={[{ required: true }]}>
          <Select {...tipoIdentificacionSelectProps} />
        </Form.Item>
        <Form.Item label="Documento" name="documento" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {/* Solo aplica si el tipo de identificación es R.U.C. (ver StorePersonaRequest). */}
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
        <Form.Item label="Roles" name="roles">
          <Select mode="multiple" {...roleSelectProps} placeholder="Sin rol" />
        </Form.Item>
      </Form>
    </Create>
  );
};
