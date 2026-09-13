import { Create, useForm } from "@refinedev/antd";
import { ApartmentOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { EdificioForm } from "./form";

export const EdificioCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<ApartmentOutlined />}>Crear edificio</PageTitle>}
    >
      <EdificioForm
        formProps={{ ...formProps, initialValues: { tiene_estacionamiento: false, ...formProps.initialValues } }}
      />
    </Create>
  );
};
