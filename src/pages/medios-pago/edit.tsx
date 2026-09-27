import { Edit, useForm } from "@refinedev/antd";
import { CreditCardOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { MedioPagoForm } from "./form";

export const MedioPagoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<CreditCardOutlined />}>Editar medio de pago</PageTitle>}
    >
      <MedioPagoForm formProps={formProps} codigoEditable={false} />
    </Edit>
  );
};
