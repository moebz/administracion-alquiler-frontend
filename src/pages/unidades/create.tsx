import { Create, useForm } from "@refinedev/antd";
import { UnidadForm } from "./form";

export const UnidadCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear unidad">
      <UnidadForm
        formProps={{ ...formProps, initialValues: { estado: "DISPONIBLE", ...formProps.initialValues } }}
      />
    </Create>
  );
};
