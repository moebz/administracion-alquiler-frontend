import { Create, useForm } from "@refinedev/antd";
import { EdificioForm } from "./form";

export const EdificioCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <EdificioForm
        formProps={{ ...formProps, initialValues: { tiene_estacionamiento: false, ...formProps.initialValues } }}
      />
    </Create>
  );
};
