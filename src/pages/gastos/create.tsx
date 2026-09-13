import { Create, useForm } from "@refinedev/antd";
import { DollarOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router";
import { PageTitle } from "../../components/page-title";
import { GastoForm } from "./form";

export const GastoCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  // Prellenado desde el botón "Registrar gasto" del detalle de Unidades
  // (frontend/src/pages/unidades/show.tsx).
  const [searchParams] = useSearchParams();
  const unidadIdParam = searchParams.get("unidad_id");
  const unidadId = unidadIdParam ? Number(unidadIdParam) : undefined;

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={<PageTitle icon={<DollarOutlined />}>Registrar gasto</PageTitle>}
    >
      <GastoForm
        formProps={{
          ...formProps,
          initialValues: { unidad_id: unidadId, requiere_aprobacion: false, ...formProps.initialValues },
        }}
        mostrarRequiereAprobacion
      />
    </Create>
  );
};
