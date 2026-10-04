import { Create, useForm } from "@refinedev/antd";
import { FileProtectOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { TimbradoForm } from "./form";

export const TimbradoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<FileProtectOutlined />}>Crear timbrado</PageTitle>}
    >
      <TimbradoForm
        formProps={{
          ...formProps,
          initialValues: { tipo: "PREIMPRESO", rangos: [{ tipo_comprobante: "FACTURA" }], ...formProps.initialValues },
        }}
        esEdicion={false}
      />
    </Create>
  );
};
