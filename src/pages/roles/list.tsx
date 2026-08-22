import { useEffect, useState } from "react";
import { List } from "@refinedev/antd";
import { App, Button, Checkbox, Table } from "antd";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import {
  buildPermissionRows,
  permissionsChanged,
  type Permission,
  type PermissionRow,
  type RoleWithPermissions,
} from "../../providers/permissions";
import { capitalize } from "../../utils/strings";

export const RoleList = () => {
  const { message } = App.useApp();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
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
    setSelected(Object.fromEntries(rolesData.map((role) => [role.name, role.permissions])));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (roleName: string, permissionName: string, checked: boolean) => {
    setSelected((prev) => {
      const current = prev[roleName] ?? [];
      const next = checked
        ? [...current, permissionName]
        : current.filter((name) => name !== permissionName);
      return { ...prev, [roleName]: next };
    });
  };

  const changedRoles = roles.filter((role) =>
    permissionsChanged(selected[role.name] ?? [], role.permissions),
  );

  const save = async () => {
    setSaving(true);
    const results = await Promise.all(
      changedRoles.map((role) =>
        kyInstance.put(`roles/${role.name}/permissions`, {
          json: { permissions: selected[role.name] ?? [] },
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

  const rows = buildPermissionRows(permissions);

  const columns = [
    {
      title: "Recurso",
      dataIndex: "group",
      onCell: (record: PermissionRow) => ({ rowSpan: record.isFirstInGroup ? record.groupSize : 0 }),
      render: capitalize,
    },
    {
      title: "Permiso",
      dataIndex: "label",
    },
    ...roles.map((role) => ({
      title: capitalize(role.name),
      key: role.name,
      align: "center" as const,
      render: (_: unknown, record: PermissionRow) => (
        <Checkbox
          checked={(selected[role.name] ?? []).includes(record.name)}
          onChange={(e) => toggle(role.name, record.name, e.target.checked)}
        />
      ),
    })),
  ];

  return (
    <List
      title="Roles y permisos"
      headerButtons={
        <Button type="primary" loading={saving} disabled={changedRoles.length === 0} onClick={save}>
          Guardar cambios
        </Button>
      }
    >
      <Table
        rowKey="name"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={false}
        bordered
      />
    </List>
  );
};
