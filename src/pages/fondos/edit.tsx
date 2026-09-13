import { Edit, useForm } from "@refinedev/antd";
import { WalletOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { FondoForm } from "./form";

export const FondoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<WalletOutlined />}>Editar fondo</PageTitle>}
    >
      <FondoForm formProps={formProps} />
    </Edit>
  );
};
