import { CheckCircleOutlined, EditOutlined, SendOutlined, StopOutlined, UserAddOutlined } from "@ant-design/icons";
import { App, Button, Space, Tag, Tooltip } from "antd";
import { useNavigate } from "react-router";
import { extractErrorMessage } from "../../providers/auth";
import { kyInstance } from "../../providers/data";
import { ACCOUNT_STATUS_COLOR, ACCOUNT_STATUS_LABEL, getAccountStatus } from "./account-status";
import type { PersonaRow } from "./types";

// Columna "Usuario" de la lista: email + estado de la cuenta + acciones
// sobre la cuenta (reenviar invitación, editar, activar/desactivar, o
// crearla si todavía no existe). Independiente de las acciones sobre la
// persona misma (ver PersonaStatusCell).
export const PersonaUsuarioCell = ({ persona, onChanged }: { persona: PersonaRow; onChanged: () => void }) => {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const usuario = persona.usuario;
  const status = getAccountStatus(usuario);

  const toggleActivaCuenta = async () => {
    if (!usuario) return;
    const action = usuario.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`users/${usuario.id}/${action}`);
    if (response.ok) {
      message.success(usuario.is_active ? "Cuenta desactivada." : "Cuenta activada.");
      onChanged();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  const resendInvitation = async () => {
    if (!usuario) return;
    const response = await kyInstance.post(`users/${usuario.id}/resend-invitation`);
    if (response.ok) {
      message.success("Invitación reenviada.");
      onChanged();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo reenviar la invitación."));
    }
  };

  return (
    <Space direction="vertical" size={4}>
      <Space size={4}>
        <span>{usuario?.email ?? "—"}</span>
        {usuario && status === "invitado" && (
          <Tooltip title="Reenviar invitación">
            <Button size="small" icon={<SendOutlined />} onClick={resendInvitation} />
          </Tooltip>
        )}
      </Space>
      <Space size={4} wrap>
        <Tag color={ACCOUNT_STATUS_COLOR[status]}>{ACCOUNT_STATUS_LABEL[status]}</Tag>
        {usuario ? (
          <>
            <Tooltip title="Editar cuenta">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/administrador/usuarios/edit/${usuario.id}`)}
              />
            </Tooltip>
            <Tooltip title={usuario.is_active ? "Desactivar cuenta" : "Activar cuenta"}>
              <Button
                size="small"
                danger={usuario.is_active}
                icon={usuario.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => {
                  if (!usuario.is_active) {
                    toggleActivaCuenta();
                    return;
                  }
                  modal.confirm({
                    title: "¿Desactivar esta cuenta?",
                    okText: "Desactivar",
                    okButtonProps: { danger: true },
                    onOk: toggleActivaCuenta,
                  });
                }}
              />
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Crear cuenta">
            <Button
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => navigate(`/administrador/usuarios/create?persona_id=${persona.id}`)}
            />
          </Tooltip>
        )}
      </Space>
    </Space>
  );
};
