import { Edit, useForm } from "@refinedev/antd";
import { FileProtectOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { TimbradoForm } from "./form";

export const TimbradoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<FileProtectOutlined />}>Editar timbrado</PageTitle>}
    >
      <TimbradoForm formProps={formProps} esEdicion />
    </Edit>
  );
};
