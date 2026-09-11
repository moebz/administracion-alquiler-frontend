import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const TipoIdentificacionCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear tipo de identificación">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Código" name="codigo" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Código SIFEN" name="codigo_sifen">
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
