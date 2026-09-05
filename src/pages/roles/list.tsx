import { EditButton, List, useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import type { RoleWithPermissions } from "../../providers/permissions";
import { capitalize } from "../../utils/strings";

export const RoleList = () => {
  const { tableProps } = useTable<RoleWithPermissions>({ syncWithLocation: true });
  const { mutate: deleteRole } = useDelete();

  return (
    <List title="Roles">
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Nombre" render={capitalize} />
        <Table.Column
          title="Tipo"
          dataIndex="es_sistema"
          render={(esSistema: boolean) => (
            <Tag color={esSistema ? "blue" : "default"}>{esSistema ? "Sistema" : "Personalizado"}</Tag>
          )}
        />
        <Table.Column title="Personas" dataIndex="personas_count" />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: RoleWithPermissions) =>
            record.es_sistema ? null : (
              <Space>
                <EditButton hideText size="small" recordItemId={record.id} />
                <Popconfirm
                  title="¿Eliminar este rol?"
                  description={`${record.personas_count} personas tienen este rol y lo van a perder.`}
                  okText="Eliminar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => deleteRole({ resource: "roles", id: record.id })}
                >
                  <Button size="small" danger>
                    Eliminar
                  </Button>
                </Popconfirm>
              </Space>
            )
          }
        />
      </Table>
    </List>
  );
};
