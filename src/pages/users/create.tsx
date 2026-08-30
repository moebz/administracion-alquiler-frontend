import { useEffect } from "react";
import { Create, useForm } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { Descriptions, Form, Input } from "antd";
import { useSearchParams } from "react-router";

type Persona = {
  id: number;
  nombre: string;
  documento: string;
  tipo_documento: { nombre: string };
  email_contacto: string | null;
};

// Sin campo de contraseña, a propósito: el admin nunca la escribe ni la
// conoce (ver ARQUITECTURA.md, "Alta de usuarios") — se dispara una invitación
// por mail al crear. Tampoco hay buscador/roles acá: la persona ya existe
// (viene de "Crear cuenta" en el listado de Personas) y sus roles se editan
// desde ahí, no desde acá.
export const UserCreate = () => {
  const [searchParams] = useSearchParams();
  const personaId = searchParams.get("persona_id");

  const { formProps, saveButtonProps, form } = useForm({
    successNotification: () => ({
      type: "success",
      message: "Usuario creado",
      description: "Se le envió una invitación por mail para elegir su contraseña.",
    }),
  });

  const { result: persona } = useOne<Persona>({
    resource: "personas",
    id: personaId ?? undefined,
    queryOptions: { enabled: !!personaId },
  });

  useEffect(() => {
    if (persona) {
      form.setFieldsValue({
        persona_id: persona.id,
        email: persona.email_contacto ?? undefined,
      });
    }
  }, [persona, form]);

  return (
    <Create saveButtonProps={saveButtonProps} title="Crear usuario">
      {persona && (
        <Descriptions column={1} size="small" style={{ marginBottom: 24 }} bordered>
          <Descriptions.Item label="Persona">{persona.nombre}</Descriptions.Item>
          <Descriptions.Item label="Documento">
            {persona.tipo_documento.nombre} {persona.documento}
          </Descriptions.Item>
        </Descriptions>
      )}
      <Form {...formProps} layout="vertical">
        <Form.Item name="persona_id" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
