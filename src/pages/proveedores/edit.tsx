import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

// Documento/tipo de documento no se editan acá: son la clave de
// deduplicación de la persona (ver PersonaBuscador, usado solo en create).
export const ProveedorEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const { selectProps: rubroSelectProps } = useSelect({
    resource: "rubros",
    optionLabel: "nombre",
    optionValue: "id",
    defaultValue: formProps.initialValues?.rubros?.map((rubro: { id: number }) => rubro.id),
  });

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar proveedor">
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{
          ...formProps.initialValues,
          // El GET trae rubros como [{id, nombre}], pero el Select (y el
          // PATCH) necesitan solo los ids. `normalize` no alcanza para esto:
          // no se aplica al initialValues, solo a los cambios posteriores.
          rubros: formProps.initialValues?.rubros?.map((rubro: { id: number }) => rubro.id),
        }}
      >
        <Form.Item label="Nombre" name={["persona", "nombre"]} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Teléfono" name={["persona", "telefono"]}>
          <Input />
        </Form.Item>
        <Form.Item label="Email de contacto" name={["persona", "email_contacto"]}>
          <Input />
        </Form.Item>
        <Form.Item label="Rubros" name="rubros" rules={[{ required: true }]}>
          <Select mode="multiple" {...rubroSelectProps} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
