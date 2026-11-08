import { useEffect, useState } from "react";
import { Create } from "@refinedev/antd";
import { IdcardOutlined, PhoneOutlined, SolutionOutlined } from "@ant-design/icons";
import { App, Col, Form, Input } from "antd";
import { PageTitle } from "../../components/page-title";
import { SectionDivider } from "../../components/section-divider";
import { SectionRow } from "../../components/section-row";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import type { EmpresaDatos } from "./types";

// Datos de la administradora: una sola fila, sin alta ni baja. No usa <Edit> de Refine porque necesita un id: carga con
// GET empresa y guarda con PUT empresa (la primera vez crea la fila, después la edita). Usa <Create> solo por su
// marco (título, tarjeta y botón de guardar).
export const EmpresaEdit = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm<EmpresaDatos>();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar los datos guardados, o el form vacío si todavía no hay.
  useEffect(() => {
    let vigente = true;
    kyInstance
      .get("empresa")
      .json<EmpresaDatos>()
      .then((datos) => vigente && form.setFieldsValue(datos))
      .catch((error: { message?: string }) => {
        if (vigente) {
          message.error(error.message ?? "No se pudieron cargar los datos de la empresa.");
        }
      })
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [form, message]);

  // Guardar los datos y mostrar cada error de validación en su campo.
  const guardar = async (valores: EmpresaDatos) => {
    setGuardando(true);
    try {
      const response = await kyInstance.put("empresa", { json: valores });

      // Rechazada: mostrar los errores de cada campo, o el mensaje general si no vienen por campo.
      if (!response.ok) {
        const body = (await response
          .clone()
          .json()
          .catch(() => null)) as { errors?: Record<string, string[]> } | null;

        if (body?.errors) {
          form.setFields(Object.entries(body.errors).map(([name, errors]) => ({ name: name as keyof EmpresaDatos, errors })));
          return;
        }

        message.error(await extractErrorMessage(response, "No se pudieron guardar los datos de la empresa."));
        return;
      }

      // Guardada: mostrar lo que quedó en la base.
      form.setFieldsValue((await response.json()) as EmpresaDatos);
      message.success("Datos de la empresa guardados.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Create
      title={<PageTitle icon={<SolutionOutlined />}>Datos de la empresa</PageTitle>}
      isLoading={cargando}
      breadcrumb={false}
      goBack={false}
      saveButtonProps={{ onClick: () => form.submit(), loading: guardando }}
    >
      <Form form={form} layout="vertical" style={{ maxWidth: 960 }} onFinish={guardar}>
        <SectionDivider icon={<IdcardOutlined />} style={{ marginTop: 0 }}>
          Identificación
        </SectionDivider>
        <SectionRow>
          <Col xs={24} md={12}>
            <Form.Item label="Razón social" name="razon_social" rules={[{ required: true }]}>
              <Input maxLength={255} />
            </Form.Item>
          </Col>
          <Col xs={16} md={8}>
            <Form.Item label="RUC" name="ruc" rules={[{ required: true }, { pattern: /^\d+$/, message: "Solo dígitos." }]}>
              <Input maxLength={20} />
            </Form.Item>
          </Col>
          <Col xs={8} md={4}>
            <Form.Item label="DV" name="dv" rules={[{ required: true }, { pattern: /^\d$/, message: "Un dígito." }]}>
              <Input maxLength={1} />
            </Form.Item>
          </Col>
        </SectionRow>

        <SectionDivider icon={<PhoneOutlined />}>Contacto</SectionDivider>
        <SectionRow>
          <Col xs={24} md={12}>
            <Form.Item label="Dirección" name="direccion">
              <Input maxLength={255} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="Teléfono" name="telefono">
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
              <Input maxLength={255} />
            </Form.Item>
          </Col>
        </SectionRow>
      </Form>
    </Create>
  );
};
