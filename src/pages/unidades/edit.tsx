import { Edit, useForm } from "@refinedev/antd";
import { HomeOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { UnidadForm } from "./form";

export const UnidadEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<HomeOutlined />}>Editar unidad</PageTitle>}
    >
      <UnidadForm formProps={formProps} />
    </Edit>
  );
};
