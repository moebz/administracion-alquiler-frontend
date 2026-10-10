import { Create, useForm } from "@refinedev/antd";
import { ProfileOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { ConceptoForm } from "./form";

export const ConceptoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<ProfileOutlined />}>Crear concepto de venta</PageTitle>}
    >
      <ConceptoForm formProps={formProps} codigoEditable />
    </Create>
  );
};
