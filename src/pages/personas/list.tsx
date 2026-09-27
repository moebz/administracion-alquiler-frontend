import { List, useTable } from "@refinedev/antd";
import { Table, Typography } from "antd";
import { RolesTags } from "../../components/roles-tags";
import { PersonaListFilters } from "./persona-list-filters";
import { PersonaStatusCell } from "./persona-status-cell";
import { PersonaUsuarioCell } from "./persona-usuario-cell";
import type { PersonaRow } from "./types";

export const PersonaList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<PersonaRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });

  const refetch = () => tableQuery.refetch();

  return (
    <List title="Personas">
      <PersonaListFilters onChange={(filters) => setFilters(filters, "replace")} />
      <Table {...tableProps} rowKey="id" scroll={{ x: "max-content" }}>
        <Table.Column
          title="Nombre"
          dataIndex="nombre"
          render={(nombre: string, record: PersonaRow) => (
            <>
              <div>{nombre}</div>
              <Typography.Text type="secondary">
                {record.tipo_identificacion.nombre} {record.documento}
              </Typography.Text>
            </>
          )}
        />
        <Table.Column dataIndex="roles" title="Roles" render={(roles: string[]) => <RolesTags roles={roles} />} />
        <Table.Column
          title="Persona"
          dataIndex="is_active"
          render={(_: boolean, record: PersonaRow) => <PersonaStatusCell persona={record} onChanged={refetch} />}
        />
        <Table.Column
          title="Usuario"
          dataIndex="usuario"
          render={(_: PersonaRow["usuario"], record: PersonaRow) => (
            <PersonaUsuarioCell persona={record} onChanged={refetch} />
          )}
        />
      </Table>
    </List>
  );
};
