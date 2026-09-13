import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const CiudadCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear ciudad">
      <Form {...formProps} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
