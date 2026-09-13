import { Create, useForm } from "@refinedev/antd";
import { UserOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { PersonaForm } from "./form";

export const PersonaCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title={<PageTitle icon={<UserOutlined />}>Crear persona</PageTitle>}>
      <PersonaForm formProps={formProps} />
    </Create>
  );
};
