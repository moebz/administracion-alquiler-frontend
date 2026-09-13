import { Edit, useForm } from "@refinedev/antd";
import { FileTextOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { ContratoAlquilerForm } from "./form";

export const ContratoAlquilerEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<FileTextOutlined />}>Editar contrato de alquiler</PageTitle>}
    >
      <ContratoAlquilerForm formProps={formProps} mostrarMontoAlquiler={false} />
    </Edit>
  );
};
