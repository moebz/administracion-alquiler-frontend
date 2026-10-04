import { Edit, useForm } from "@refinedev/antd";
import { ClusterOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { EstablecimientoForm } from "./form";

export const EstablecimientoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<ClusterOutlined />}>Editar establecimiento</PageTitle>}
    >
      <EstablecimientoForm formProps={formProps} codigoEditable={false} />
    </Edit>
  );
};
