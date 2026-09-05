import { useEffect, useMemo, useState } from "react";
import { List } from "@refinedev/antd";
import { App, Button, Checkbox, Input, Select, Space, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import {
  buildMatrixRows,
  filterPermissions,
  filterRoles,
  groupCheckboxState,
  isPermissionLocked,
  permissionsChanged,
  toggleGroupPermissions,
  type MatrixRow,
  type Permission,
  type RoleWithPermissions,
} from "../../providers/permissions";
import { capitalize } from "../../utils/strings";

export const RolePermissions = () => {
  const { message } = App.useApp();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Record<number, string[]>>({});
  const [search, setSearch] = useState("");
  const [visibleRoleIds, setVisibleRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [rolesData, permissionsData] = await Promise.all([
      kyInstance.get("roles").json<RoleWithPermissions[]>(),
      kyInstance.get("permissions").json<Permission[]>(),
    ]);
    setRoles(rolesData);
    setPermissions(permissionsData);
    setSelected(Object.fromEntries(rolesData.map((role) => [role.id, role.permissions])));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (role: RoleWithPermissions, permissionName: string, checked: boolean) => {
    setSelected((prev) => {
      const current = prev[role.id] ?? [];
      const next = checked
        ? [...current, permissionName]
        : current.filter((name) => name !== permissionName);
      return { ...prev, [role.id]: next };
    });
  };

  const toggleGroup = (role: RoleWithPermissions, togglableNames: string[], checked: boolean) => {
    setSelected((prev) => ({
      ...prev,
      [role.id]: toggleGroupPermissions(prev[role.id] ?? [], togglableNames, checked),
    }));
  };

  const changedRoles = roles.filter((role) =>
    permissionsChanged(selected[role.id] ?? [], role.permissions),
  );

  const save = async () => {
    setSaving(true);
    const results = await Promise.all(
      changedRoles.map((role) =>
        kyInstance.put(`roles/${role.id}/permissions`, {
          json: { permissions: selected[role.id] ?? [] },
        }),
      ),
    );

    const failed = results.filter((response) => !response.ok);
    if (failed.length === 0) {
      message.success("Permisos actualizados.");
    } else {
      message.error(await extractErrorMessage(failed[0], "No se pudieron guardar los permisos."));
    }
    await load();
    setSaving(false);
  };

  const rows = useMemo(
    () => buildMatrixRows(filterPermissions(permissions, search)),
    [permissions, search],
  );

  const visibleRoles = useMemo(
    () => filterRoles(roles, visibleRoleIds),
    [roles, visibleRoleIds],
  );

  const columns = [
    {
      title: "Recurso",
      key: "group",
      onCell: (record: MatrixRow) => ({ rowSpan: record.isFirstInGroup ? record.groupSize : 0 }),
      render: (_: unknown, record: MatrixRow) =>
        record.rowType === "group" ? <b>{record.groupLabel}</b> : null,
    },
    {
      title: "Permiso",
      key: "label",
      render: (_: unknown, record: MatrixRow) =>
        record.rowType === "group" ? (
          <span style={{ color: "rgba(0, 0, 0, 0.45)", fontStyle: "italic" }}>Todos</span>
        ) : (
          record.label
        ),
    },
    ...visibleRoles.map((role) => ({
      title: (
        <>
          {capitalize(role.name)} {role.es_sistema && <Tag color="blue">Sistema</Tag>}
        </>
      ),
      key: role.id,
      align: "center" as const,
      render: (_: unknown, record: MatrixRow) => {
        if (record.rowType === "group") {
          const state = groupCheckboxState(role, record.names, selected[role.id] ?? []);
          return (
            <Checkbox
              checked={state.checked}
              indeterminate={state.indeterminate}
              disabled={state.disabled}
              onChange={(e) => toggleGroup(role, state.togglableNames, e.target.checked)}
            />
          );
        }
        const locked = isPermissionLocked(role, record.name);
        return (
          <Checkbox
            checked={locked || (selected[role.id] ?? []).includes(record.name)}
            disabled={locked}
            onChange={(e) => toggle(role, record.name, e.target.checked)}
          />
        );
      },
    })),
  ];

  return (
    <List
      title="Permisos por rol"
      headerButtons={
        <Button type="primary" loading={saving} disabled={changedRoles.length === 0} onClick={save}>
          Guardar cambios
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          allowClear
          placeholder="Buscar recurso o permiso..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
        <Select
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Mostrar todos los roles"
          value={visibleRoleIds}
          onChange={setVisibleRoleIds}
          options={roles.map((role) => ({ value: role.id, label: capitalize(role.name) }))}
          style={{ minWidth: 260 }}
        />
      </Space>
      <Table
        rowKey="key"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={false}
        bordered
        sticky
        scroll={{ x: "max-content" }}
      />
    </List>
  );
};
