import { Edit, useForm } from "@refinedev/antd";
import { PrinterOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { PuntoExpedicionForm } from "./form";

export const PuntoExpedicionEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<PrinterOutlined />}>Editar punto de expedición</PageTitle>}
    >
      <PuntoExpedicionForm formProps={formProps} codigoEditable={false} />
    </Edit>
  );
};
