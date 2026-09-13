import { Edit, useForm } from "@refinedev/antd";
import { EdificioForm } from "./form";

export const EdificioEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
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
