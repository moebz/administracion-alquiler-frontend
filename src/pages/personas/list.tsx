import { useState } from "react";
import { EditButton, List, useSelect, useTable } from "@refinedev/antd";
import type { CrudFilter } from "@refinedev/core";
import { App, Button, Input, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useNavigate } from "react-router";
import { ActiveFilterSwitch } from "../../components/active-filter-switch";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import { capitalize } from "../../utils/strings";
import { ACCOUNT_STATUS_COLOR, ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_OPTIONS, getAccountStatus } from "./account-status";
import type { PersonaRow } from "./types";

export const PersonaList = () => {
  const { tableProps, tableQuery, setFilters } = useTable<PersonaRow>({
    syncWithLocation: true,
    filters: {
      initial: [{ field: "is_active", operator: "eq", value: true }],
    },
  });
  const { message } = App.useApp();
  const navigate = useNavigate();

  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: (role: { name: string }) => capitalize(role.name),
    optionValue: "name",
  });

  const [search, setSearch] = useState<string>();
  const [roles, setRoles] = useState<string[]>([]);
  const [estadoCuenta, setEstadoCuenta] = useState<string>();
  const [showInactive, setShowInactive] = useState(false);

  // Los filtros del header son independientes entre sí — se recalcula el
  // array completo de CrudFilters cada vez que cambia uno, en vez de tratar
  // de mergear contra `filters` de useTable (más simple que parsear su forma
  // de vuelta).
  const applyFilters = (overrides: {
    search?: string;
    roles?: string[];
    estadoCuenta?: string;
    showInactive?: boolean;
  }) => {
    const nextSearch = "search" in overrides ? overrides.search : search;
    const nextRoles = overrides.roles ?? roles;
    const nextEstadoCuenta = "estadoCuenta" in overrides ? overrides.estadoCuenta : estadoCuenta;
    const nextShowInactive = overrides.showInactive ?? showInactive;

    setSearch(nextSearch);
    setRoles(nextRoles);
    setEstadoCuenta(nextEstadoCuenta);
    setShowInactive(nextShowInactive);

    const filters: CrudFilter[] = [];
    if (nextSearch) {
      filters.push({ field: "search", operator: "eq", value: nextSearch });
    }
    if (nextRoles.length > 0) {
      filters.push({ field: "roles", operator: "in", value: nextRoles });
    }
    if (nextEstadoCuenta) {
      filters.push({ field: "estado_cuenta", operator: "eq", value: nextEstadoCuenta });
    }
    if (!nextShowInactive) {
      filters.push({ field: "is_active", operator: "eq", value: true });
    }
    setFilters(filters, "replace");
  };

  const toggleActivaPersona = async (record: PersonaRow) => {
    const action = record.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`personas/${record.id}/${action}`);
    if (response.ok) {
      message.success(record.is_active ? "Persona desactivada." : "Persona activada.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  const toggleActivaCuenta = async (record: PersonaRow) => {
    if (!record.usuario) {
      return;
    }
    const action = record.usuario.is_active ? "deactivate" : "activate";
    const response = await kyInstance.patch(`users/${record.usuario.id}/${action}`);
    if (response.ok) {
      message.success(record.usuario.is_active ? "Cuenta desactivada." : "Cuenta activada.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo actualizar el estado."));
    }
  };

  const resendInvitation = async (usuarioId: number) => {
    const response = await kyInstance.post(`users/${usuarioId}/resend-invitation`);
    if (response.ok) {
      message.success("Invitación reenviada.");
      tableQuery.refetch();
    } else {
      message.error(await extractErrorMessage(response, "No se pudo reenviar la invitación."));
    }
  };

  return (
    <List title="Personas">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Buscar por nombre, documento o email"
          style={{ width: 280 }}
          defaultValue={search}
          onSearch={(value) => applyFilters({ search: value || undefined })}
        />
        <Space>
          <span>Roles</span>
          <Select
            mode="multiple"
            style={{ minWidth: 220 }}
            allowClear
            placeholder="Todos"
            options={roleSelectProps.options}
            value={roles}
            onChange={(value) => applyFilters({ roles: value })}
          />
        </Space>
        <Space>
          <span>Estado de cuenta</span>
          <Select
            style={{ minWidth: 200 }}
            allowClear
            placeholder="Todos"
            options={ACCOUNT_STATUS_OPTIONS}
            value={estadoCuenta}
            onChange={(value) => applyFilters({ estadoCuenta: value })}
          />
        </Space>
        <ActiveFilterSwitch
          checked={showInactive}
          onChange={(checked) => applyFilters({ showInactive: checked })}
        />
      </Space>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="nombre" title="Nombre" />
        <Table.Column
          title="Documento"
          dataIndex="documento"
          render={(documento: string, record: PersonaRow) => `${record.tipo_documento.nombre} ${documento}`}
        />
        <Table.Column
          dataIndex="roles"
          title="Roles"
          render={(personaRoles: string[]) => (personaRoles.length ? personaRoles.map(capitalize).join(", ") : "—")}
        />
        <Table.Column
          title="Email de cuenta"
          dataIndex="usuario"
          render={(usuario: PersonaRow["usuario"]) => usuario?.email ?? "—"}
        />
        <Table.Column
          title="Estado de cuenta"
          dataIndex="usuario"
          render={(usuario: PersonaRow["usuario"]) => {
            const status = getAccountStatus(usuario);
            return <Tag color={ACCOUNT_STATUS_COLOR[status]}>{ACCOUNT_STATUS_LABEL[status]}</Tag>;
          }}
        />
        <Table.Column
          title="Estado de persona"
          dataIndex="is_active"
          render={(isActive: boolean) => (
            <Tag color={isActive ? "green" : "red"}>{isActive ? "Activa" : "Inactiva"}</Tag>
          )}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: PersonaRow) => (
            <Space wrap>
              <EditButton hideText size="small" recordItemId={record.id} />
              {record.usuario ? (
                <>
                  <Button
                    size="small"
                    onClick={() => navigate(`/administrador/usuarios/edit/${record.usuario!.id}`)}
                  >
                    Editar cuenta
                  </Button>
                  {getAccountStatus(record.usuario) === "invitado" && (
                    <Button size="small" onClick={() => resendInvitation(record.usuario!.id)}>
                      Reenviar invitación
                    </Button>
                  )}
                  <Button
                    size="small"
                    danger={record.usuario.is_active}
                    onClick={() => toggleActivaCuenta(record)}
                  >
                    {record.usuario.is_active ? "Desactivar cuenta" : "Activar cuenta"}
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  onClick={() => navigate(`/administrador/usuarios/create?persona_id=${record.id}`)}
                >
                  Crear cuenta
                </Button>
              )}
              {record.is_active ? (
                <Popconfirm
                  title="¿Desactivar esta persona?"
                  description={record.usuario ? "Esto también desactiva su cuenta." : undefined}
                  okText="Desactivar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => toggleActivaPersona(record)}
                >
                  <Button size="small" danger>
                    Desactivar persona
                  </Button>
                </Popconfirm>
              ) : (
                <Button size="small" onClick={() => toggleActivaPersona(record)}>
                  Activar persona
                </Button>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
