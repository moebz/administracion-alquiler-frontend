import { EditButton, List, useTable } from "@refinedev/antd";
import { App, Button, Space, Table, Tag } from "antd";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import { getUserStatus, USER_STATUS_COLOR, USER_STATUS_LABEL, type UserRow } from "./user-status";

export const UserList = () => {
  const { tableProps, tableQuery } = useTable<UserRow>({
    syncWithLocation: true,
  });
  const { message } = App.useApp();

  const resendInvitation = async (id: number) => {
    const response = await kyInstance.post(`users/${id}/resend-invitation`);
    if (response.ok) {
      message.success("Invitación reenviada.");
      tableQuery.refetch();
    } else {
      // El backend explica por qué falló (ej. "Este usuario ya activó su
      // cuenta, no hay invitación para reenviar.") — se muestra ese mensaje
      // en vez de uno genérico que lo tapa.
      message.error(await extractErrorMessage(response, "No se pudo reenviar la invitación."));
    }
  };

  const toggleActive = async (record: UserRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`users/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Usuario desactivado." : "Usuario activado.");
      tableQuery.refetch();
    } else {
      // Ídem: acá vive el mensaje de "no podés desactivarte a vos mismo" /
      // "no podés sacarte tu propio rol de administrador".
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Nombre" />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column
          dataIndex="roles"
          title="Roles"
          render={(roles: string[]) => roles.join(", ")}
        />
        <Table.Column
          title="Estado"
          dataIndex="status"
          render={(_, record: UserRow) => {
            const status = getUserStatus(record);
            return <Tag color={USER_STATUS_COLOR[status]}>{USER_STATUS_LABEL[status]}</Tag>;
          }}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: UserRow) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              {getUserStatus(record) === "invited" && (
                <Button size="small" onClick={() => resendInvitation(record.id)}>
                  Reenviar invitación
                </Button>
              )}
              <Button size="small" danger={record.is_active} onClick={() => toggleActive(record)}>
                {record.is_active ? "Desactivar" : "Activar"}
              </Button>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
