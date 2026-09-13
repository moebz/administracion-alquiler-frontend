import { Create, useForm } from "@refinedev/antd";
import { BloqueForm } from "./form";

export const BloqueCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear bloque">
      <BloqueForm formProps={formProps} />
    </Create>
  );
};
