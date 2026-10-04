import { Create, useForm } from "@refinedev/antd";
import { ClusterOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { EstablecimientoForm } from "./form";

export const EstablecimientoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<ClusterOutlined />}>Crear establecimiento</PageTitle>}
    >
      <EstablecimientoForm formProps={formProps} codigoEditable />
    </Create>
  );
};
