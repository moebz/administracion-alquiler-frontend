import { Create, useForm } from "@refinedev/antd";
import { PersonaForm } from "./form";

export const PersonaCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear persona">
      <PersonaForm formProps={formProps} />
    </Create>
  );
};
