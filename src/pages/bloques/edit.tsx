import { Edit, useForm } from "@refinedev/antd";
import { BloqueForm } from "./form";

export const BloqueEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar bloque">
      <BloqueForm formProps={formProps} />
    </Edit>
  );
};
