import { Edit, useForm } from "@refinedev/antd";
import { Alert, Descriptions, Tag } from "antd";
import { GASTO_ESTADO_COLOR, GASTO_ESTADO_LABEL, type GastoEstado } from "./types";
import { GastoForm } from "./form";

// El estado (SOLICITADO/APROBADO/RECHAZADO/...) no se edita acá: cambia vía
// las acciones dedicadas Aprobar/Rechazar del listado (pages/gastos/list.tsx).
// Un gasto solo puede editarse en estado SOLICITADO (misma regla que
// GastoController::update en el backend); fuera de ese estado el form queda
// de solo lectura.
export const GastoEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  const estado = formProps.initialValues?.estado as GastoEstado | undefined;
  // Mientras el registro no cargó todavía no hay estado: no bloqueamos el
  // form para no mostrar el aviso de solo lectura en falso durante la carga.
  const editable = !estado || estado === "SOLICITADO";

  return (
    <Edit
      saveButtonProps={editable ? saveButtonProps : { ...saveButtonProps, disabled: true }}
      isLoading={formLoading}
      title="Editar gasto"
    >
      {estado && (
        <Descriptions column={1} size="small" style={{ marginBottom: 24 }} bordered>
          <Descriptions.Item label="Estado">
            <Tag color={GASTO_ESTADO_COLOR[estado]}>{GASTO_ESTADO_LABEL[estado]}</Tag>
          </Descriptions.Item>
          {formProps.initialValues?.motivo_rechazo && (
            <Descriptions.Item label="Motivo de rechazo">{formProps.initialValues.motivo_rechazo}</Descriptions.Item>
          )}
        </Descriptions>
      )}
      {!editable && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message="Este gasto no se puede editar"
          description="Solo se pueden editar gastos en estado Solicitado."
        />
      )}
      <GastoForm formProps={{ ...formProps, disabled: !editable }} mostrarRequiereAprobacion={false} />
    </Edit>
  );
};
