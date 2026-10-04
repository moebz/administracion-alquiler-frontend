import { Create, useForm } from "@refinedev/antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router";
import { PageTitle } from "../../components/page-title";
import { PuntoExpedicionForm } from "./form";

export const PuntoExpedicionCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const establecimientoIdParam = useSearchParams()[0].get("establecimiento_id");
  const establecimientoId = establecimientoIdParam ? Number(establecimientoIdParam) : undefined;

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<PrinterOutlined />}>Crear punto de expedición</PageTitle>}
    >
      <PuntoExpedicionForm
        formProps={{ ...formProps, initialValues: { establecimiento_id: establecimientoId, ...formProps.initialValues } }}
        codigoEditable
      />
    </Create>
  );
};
