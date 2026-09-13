import { Create, useForm } from "@refinedev/antd";
import { FileTextOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router";
import { PageTitle } from "../../components/page-title";
import { ContratoAlquilerForm } from "./form";

export const ContratoAlquilerCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  // Prellenado desde el botón "Crear contrato" del detalle de Unidades
  // (frontend/src/pages/unidades/show.tsx).
  const [searchParams] = useSearchParams();
  const unidadIdParam = searchParams.get("unidad_id");
  const unidadId = unidadIdParam ? Number(unidadIdParam) : undefined;

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<FileTextOutlined />}>Crear contrato de alquiler</PageTitle>}
    >
      <ContratoAlquilerForm
        formProps={{
          ...formProps,
          initialValues: {
            unidad_id: unidadId,
            estado: "VIGENTE",
            expensas_a_cargo_de: "INQUILINO",
            mora_pct_diario: 0,
            dias_gracia: 0,
            ...formProps.initialValues,
          },
        }}
        mostrarMontoAlquiler
      />
    </Create>
  );
};
