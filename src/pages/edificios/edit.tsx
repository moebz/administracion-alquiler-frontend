import { Edit, useForm } from "@refinedev/antd";
import { ApartmentOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { EdificioForm } from "./form";

export const EdificioEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<ApartmentOutlined />}>Editar edificio</PageTitle>}
    >
      <EdificioForm
        formProps={{
          ...formProps,
          initialValues: {
            ...formProps.initialValues,
            comodidades: formProps.initialValues?.comodidades?.map((comodidad: { id: number }) => comodidad.id),
          },
        }}
      />
    </Edit>
  );
};
