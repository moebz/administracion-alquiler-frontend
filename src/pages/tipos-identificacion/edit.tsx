import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

// Sin campo `codigo`: es de solo lectura una vez creado, la lógica de
// negocio cuelga de él (ver ARQUITECTURA.md, backend UpdateTipoIdentificacionRequest).
export const TipoIdentificacionEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar tipo de identificación">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Código SIFEN" name="codigo_sifen">
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
