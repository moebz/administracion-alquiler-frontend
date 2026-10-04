import { useEffect } from "react";
import { Create, useForm } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { FileTextOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router";
import { PageTitle } from "../../components/page-title";
import { ContratoAlquilerForm } from "./form";
import { valoresRenovacion } from "./renovar";
import type { ContratoAlquilerRow } from "./types";

export const ContratoAlquilerCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  // Prellenado desde "Crear contrato" del detalle de Unidades (pages/unidades/show.tsx) y "Renovar" del listado.
  const [searchParams] = useSearchParams();
  const unidadIdParam = searchParams.get("unidad_id");
  const unidadId = unidadIdParam ? Number(unidadIdParam) : undefined;
  const renovarId = searchParams.get("renovar");

  const { result: contratoAnterior } = useOne<ContratoAlquilerRow>({
    resource: "contratos-alquiler",
    id: renovarId ?? "",
    queryOptions: { enabled: !!renovarId },
  });

  const form = formProps.form;
  useEffect(() => {
    if (contratoAnterior) {
      form?.setFieldsValue(valoresRenovacion(contratoAnterior));
    }
  }, [contratoAnterior, form]);

  return (
    <Create
      saveButtonProps={saveButtonProps}
      title={
        <PageTitle icon={<FileTextOutlined />}>
          {renovarId ? "Renovar contrato de alquiler" : "Crear contrato de alquiler"}
        </PageTitle>
      }
    >
      <ContratoAlquilerForm
        formProps={{
          ...formProps,
          initialValues: {
            unidad_id: unidadId,
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
