import { Create, useForm, useSelect } from "@refinedev/antd";
import { ShopOutlined, TagsOutlined } from "@ant-design/icons";
import { Form, Select } from "antd";
import { PersonaBuscador } from "../../components/persona-buscador";
import { PageTitle } from "../../components/page-title";
import { SectionDivider } from "../../components/section-divider";

export const ProveedorCreate = () => {
  const { formProps, saveButtonProps, form } = useForm({});

  const { selectProps: rubroSelectProps } = useSelect({
    resource: "rubros",
    optionLabel: "nombre",
    optionValue: "id",
  });

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<ShopOutlined />}>Crear proveedor</PageTitle>}
    >
      <Form {...formProps} layout="vertical" style={{ maxWidth: 720 }}>
        <PersonaBuscador form={form} />
        <SectionDivider icon={<TagsOutlined />}>Rubros</SectionDivider>
        <Form.Item label="Rubros" name="rubros" rules={[{ required: true }]}>
          <Select mode="multiple" {...rubroSelectProps} />
        </Form.Item>
      </Form>
    </Create>
  );
};
