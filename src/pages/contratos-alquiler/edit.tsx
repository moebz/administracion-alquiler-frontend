import { Edit, useForm } from "@refinedev/antd";
import { ContratoAlquilerForm } from "./form";

export const ContratoAlquilerEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar contrato de alquiler">
      <ContratoAlquilerForm formProps={formProps} mostrarMontoAlquiler={false} />
    </Edit>
  );
};
