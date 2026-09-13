import { Edit, useForm } from "@refinedev/antd";
import { PersonaForm } from "./form";

// A diferencia de UserEdit/ProveedorEdit, acá documento/tipo de identificación
// SÍ se editan: este es el ABM canónico de la persona.
// El backend devuelve `roles` como array de strings directamente (no
// [{id, nombre}]) — a diferencia de comodidades/rubros, acá no hace falta
// mapear initialValues a ids (ver PersonaForm).
export const PersonaEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading} title="Editar persona">
      <PersonaForm formProps={formProps} />
    </Edit>
  );
};
