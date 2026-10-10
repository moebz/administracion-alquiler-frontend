import { Edit, useForm } from "@refinedev/antd";
import { ProfileOutlined } from "@ant-design/icons";
import { PageTitle } from "../../components/page-title";
import { ConceptoForm } from "./form";

export const ConceptoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title={<PageTitle icon={<ProfileOutlined />}>Editar concepto de venta</PageTitle>}
    >
      <ConceptoForm
        formProps={{
          ...formProps,
          // El backend manda el decimal como string ("150000.0000"); el InputNumber necesita un number.
          initialValues: {
            ...formProps.initialValues,
            precio_unitario:
              formProps.initialValues?.precio_unitario == null
                ? null
                : Number(formProps.initialValues.precio_unitario),
          },
        }}
        codigoEditable={false}
      />
    </Edit>
  );
};
