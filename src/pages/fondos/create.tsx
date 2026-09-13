import { Create, useForm } from "@refinedev/antd";
import { WalletOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { FondoForm } from "./form";

export const FondoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps} title={<PageTitle icon={<WalletOutlined />}>Crear fondo</PageTitle>}>
      <FondoForm formProps={formProps} />
    </Create>
  );
};
