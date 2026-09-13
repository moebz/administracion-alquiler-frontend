import { Edit, useForm } from "@refinedev/antd";
import { UnidadForm } from "./form";

export const UnidadEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar unidad">
      <UnidadForm formProps={formProps} />
    </Edit>
  );
};
