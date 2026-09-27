import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { UserOutlined } from "@ant-design/icons";
import { Card, Descriptions, Space, Tag } from "antd";
import { capitalize } from "../../utils/strings";
import { PageTitle } from "../../components/page-title";
import { PersonaCuentasBancarias } from "./cuentas-bancarias";
import { TIPO_PERSONA_LABEL, type PersonaRow } from "./types";

export const PersonaShow = () => {
  const { query, result: persona } = useShow<PersonaRow>();

  return (
    <Show
      isLoading={query.isLoading}
      title={<PageTitle icon={<UserOutlined />}>Detalle de la persona</PageTitle>}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Datos de la persona" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Nombre">{persona?.nombre}</Descriptions.Item>
            <Descriptions.Item label="Documento">
              {persona && `${persona.tipo_identificacion.nombre} ${persona.documento}`}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo de persona">
              {persona && TIPO_PERSONA_LABEL[persona.tipo_persona]}
            </Descriptions.Item>
            <Descriptions.Item label="Ciudad">{persona?.ciudad?.nombre ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Dirección">{persona?.direccion ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Teléfono">{persona?.telefono ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Email de contacto">{persona?.email_contacto ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Roles">
              {persona && persona.roles.length > 0 ? (
                <Space size={[4, 4]} wrap>
                  {persona.roles.map((role) => (
                    <Tag key={role}>{capitalize(role)}</Tag>
                  ))}
                </Space>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              {persona && (
                <Tag color={persona.is_active ? "green" : "red"}>{persona.is_active ? "Activa" : "Inactiva"}</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {persona && <PersonaCuentasBancarias personaId={persona.id} personaNombre={persona.nombre} />}
      </Space>
    </Show>
  );
};
