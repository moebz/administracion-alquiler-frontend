import { useState } from "react";
import { useSelect } from "@refinedev/antd";
import { Alert, Button, Form, Input, Select, Space } from "antd";
import type { FormInstance } from "antd";
import { kyInstance } from "../providers/data";

type PersonaBuscadorResultado = {
  found: boolean;
  id?: number;
  nombre?: string;
  telefono?: string | null;
  email_contacto?: string | null;
  ya_es_usuario?: boolean;
  ya_es_proveedor?: boolean;
};

type Props = {
  form: FormInstance;
  conflictField: "ya_es_usuario" | "ya_es_proveedor";
  conflictMessage: string;
};

// Buscador de deduplicación: antes de crear un Usuario/Proveedor se busca si
// la persona ya existe por tipo + número de documento, para reusarla en vez
// de duplicarla (ver ARQUITECTURA.md, "Personas, usuarios y proveedores").
export const PersonaBuscador = ({ form, conflictField, conflictMessage }: Props) => {
  const { selectProps: tipoDocumentoSelectProps } = useSelect({
    resource: "tipos-documento",
    optionLabel: "nombre",
    optionValue: "id",
  });

  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<PersonaBuscadorResultado | null>(null);

  const buscar = async () => {
    const tipoDocumentoId = form.getFieldValue(["persona", "tipo_documento_id"]);
    const documento = form.getFieldValue(["persona", "documento"]);
    if (!tipoDocumentoId || !documento) {
      return;
    }

    setBuscando(true);
    try {
      const data = await kyInstance
        .get("personas/buscar", { searchParams: { tipo_documento_id: tipoDocumentoId, documento } })
        .json<PersonaBuscadorResultado>();

      setResultado(data);
      form.setFieldsValue({
        persona_id: data.found ? data.id : undefined,
        persona: {
          tipo_documento_id: tipoDocumentoId,
          documento,
          nombre: data.found ? data.nombre : undefined,
          telefono: data.found ? (data.telefono ?? undefined) : undefined,
          email_contacto: data.found ? (data.email_contacto ?? undefined) : undefined,
        },
      });
    } finally {
      setBuscando(false);
    }
  };

  const buscarDeNuevo = () => {
    setResultado(null);
    form.setFieldsValue({ persona_id: undefined });
  };

  const personaEncontrada = resultado?.found ?? false;
  const hayConflicto = personaEncontrada && resultado?.[conflictField];

  return (
    <>
      <Form.Item name="persona_id" hidden>
        <Input />
      </Form.Item>
      <Space align="start" wrap>
        <Form.Item
          label="Tipo de documento"
          name={["persona", "tipo_documento_id"]}
          rules={[{ required: true }]}
        >
          <Select {...tipoDocumentoSelectProps} style={{ width: 160 }} disabled={personaEncontrada} />
        </Form.Item>
        <Form.Item label="Documento" name={["persona", "documento"]} rules={[{ required: true }]}>
          <Input style={{ width: 160 }} disabled={personaEncontrada} />
        </Form.Item>
        <Form.Item label=" ">
          {personaEncontrada ? (
            <Button onClick={buscarDeNuevo}>Buscar otra persona</Button>
          ) : (
            <Button onClick={buscar} loading={buscando}>
              Buscar
            </Button>
          )}
        </Form.Item>
      </Space>
      {resultado && (
        <Alert
          type={hayConflicto ? "error" : personaEncontrada ? "info" : "warning"}
          showIcon
          style={{ marginBottom: 16 }}
          message={
            hayConflicto
              ? conflictMessage
              : personaEncontrada
                ? "Persona encontrada, se reutilizarán sus datos."
                : "No se encontró ninguna persona con ese documento, se creará una nueva."
          }
        />
      )}
      <Form.Item label="Nombre" name={["persona", "nombre"]} rules={[{ required: true }]}>
        <Input disabled={personaEncontrada} />
      </Form.Item>
      <Form.Item label="Teléfono" name={["persona", "telefono"]}>
        <Input disabled={personaEncontrada} />
      </Form.Item>
      <Form.Item label="Email de contacto" name={["persona", "email_contacto"]}>
        <Input disabled={personaEncontrada} />
      </Form.Item>
    </>
  );
};
