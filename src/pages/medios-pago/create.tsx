import { Create, useForm } from "@refinedev/antd";
import { CreditCardOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { MedioPagoForm } from "./form";

export const MedioPagoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<CreditCardOutlined />}>Crear medio de pago</PageTitle>}
    >
      <MedioPagoForm
        formProps={{
          ...formProps,
          initialValues: { requiere_datos_bancarios: false, ...formProps.initialValues },
        }}
        codigoEditable
      />
    </Create>
  );
};
