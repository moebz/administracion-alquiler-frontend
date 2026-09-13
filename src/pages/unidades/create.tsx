import { Create, useForm } from "@refinedev/antd";
import { HomeOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { UnidadForm } from "./form";

export const UnidadCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title={<PageTitle icon={<HomeOutlined />}>Crear unidad</PageTitle>}>
      <UnidadForm
        formProps={{ ...formProps, initialValues: { estado: "DISPONIBLE", ...formProps.initialValues } }}
      />
    </Create>
  );
};
