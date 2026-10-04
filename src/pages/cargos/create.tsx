import { Create, useForm } from "@refinedev/antd";
import { ReconciliationOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { CargoForm } from "./form";

export const CargoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<ReconciliationOutlined />}>Nuevo cargo</PageTitle>}
    >
      <CargoForm formProps={{ ...formProps, initialValues: { tipo: "ALQUILER", ...formProps.initialValues } }} />
    </Create>
  );
};
