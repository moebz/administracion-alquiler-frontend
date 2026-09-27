import { EditButton, ShowButton } from "@refinedev/antd";
import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button, Space, Tag, Tooltip } from "antd";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import type { PersonaRow } from "./types";

// Columna "Persona" de la lista: estado + acciones sobre la persona misma
// (ver/editar/activar/desactivar). Independiente de las acciones sobre su
// cuenta de usuario (ver PersonaUsuarioCell).
export const PersonaStatusCell = ({ persona, onChanged }: { persona: PersonaRow; onChanged: () => void }) => {
  const { message, modal } = App.useApp();
  const isActive = persona.is_active;

  const toggleActiva = async () => {
    const action = isActive ? "deactivate" : "activate";
    const response = await kyInstance.patch(`personas/${persona.id}/${action}`);
    if (response.ok) {
      message.success(isActive ? "Persona desactivada." : "Persona activada.");
      onChanged();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <Space size={4} wrap>
      <Tag color={isActive ? "green" : "red"}>{isActive ? "Activa" : "Inactiva"}</Tag>
      <Tooltip title="Ver persona">
        <ShowButton hideText size="small" recordItemId={persona.id} />
      </Tooltip>
      <Tooltip title="Editar persona">
        <EditButton hideText size="small" recordItemId={persona.id} />
      </Tooltip>
      <Tooltip title={isActive ? "Desactivar persona" : "Activar persona"}>
        <Button
          size="small"
          danger={isActive}
          icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
          onClick={() => {
            if (!isActive) {
              toggleActiva();
              return;
            }
            modal.confirm({
              title: "¿Desactivar esta persona?",
              content: persona.usuario ? "Esto también desactiva su cuenta." : undefined,
              okText: "Desactivar",
              okButtonProps: { danger: true },
              onOk: toggleActiva,
            });
          }}
        />
      </Tooltip>
    </Space>
  );
};
