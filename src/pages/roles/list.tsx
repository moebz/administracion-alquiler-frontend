import { useEffect, useMemo, useState } from "react";
import { List } from "@refinedev/antd";
import {
  App,
  Badge,
  Button,
  Checkbox,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { LockOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { kyInstance } from "../../providers/data";
import { extractErrorMessage } from "../../providers/auth";
import {
  filterPermissions,
  filterRolesByName,
  groupCheckboxState,
  groupPermissions,
  isPermissionLocked,
  permissionsChanged,
  permissionsSummary,
  splitRolesByType,
  toggleGroupPermissions,
  type Permission,
  type RoleWithPermissions,
} from "../../providers/permissions";
import { capitalize } from "../../utils/strings";

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

// Alto de los dos paneles (lista de roles / permisos del rol elegido): con
// 10-20 roles y ~15 recursos, cada uno puede superar el viewport — quedan
// con su propio scroll en vez de scrollear la página entera, y el buscador
// de cada panel queda fijo arriba.
const PANEL_MAX_HEIGHT = "calc(100vh - 260px)";

type RoleModalState = { mode: "create" } | { mode: "rename"; role: RoleWithPermissions };

// Fusiona lo que antes eran dos pantallas ("Roles" y "Permisos por rol"): un
// rol a la vez (panel de roles a la izquierda, sus permisos a la derecha) en
// vez de una matriz con todos los roles como columnas — con 10-20 roles
// personalizados esa matriz quedaba angosta y la mayoría de sus columnas
// (administrador, propietario, inquilino) no aportaban nada para comparar.
export const RoleList = () => {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isCompact = !screens.lg;

  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  // Permisos en edición por rol, hasta que se guardan. Un rol sin entrada acá
  // todavía no fue tocado: su draft es directamente `role.permissions`.
  const [draft, setDraft] = useState<Record<number, string[]>>({});

  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const [roleModal, setRoleModal] = useState<RoleModalState | null>(null);
  const [roleForm] = Form.useForm<{ name: string }>();
  const [roleModalSaving, setRoleModalSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        kyInstance.get("roles").json<RoleWithPermissions[]>(),
        kyInstance.get("permissions").json<Permission[]>(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setSelectedRoleId(rolesData[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const currentRole = roles.find((role) => role.id === selectedRoleId) ?? null;

  const draftFor = (role: RoleWithPermissions) => draft[role.id] ?? role.permissions;
  const isDirty = (role: RoleWithPermissions) => permissionsChanged(draftFor(role), role.permissions);

  const discardDraft = (roleId: number) =>
    setDraft((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });

  const selectRole = (role: RoleWithPermissions) => {
    if (currentRole && currentRole.id !== role.id && isDirty(currentRole)) {
      modal.confirm({
        title: "Cambios sin guardar",
        content: `"${capitalize(currentRole.name)}" tiene cambios sin guardar. Si continuás, se van a descartar.`,
        okText: "Descartar y continuar",
        okButtonProps: { danger: true },
        cancelText: "Seguir editando",
        onOk: () => {
          discardDraft(currentRole.id);
          setSelectedRoleId(role.id);
        },
      });
      return;
    }
    setSelectedRoleId(role.id);
  };

  const toggle = (role: RoleWithPermissions, name: string, checked: boolean) => {
    setDraft((prev) => {
      const current = prev[role.id] ?? role.permissions;
      const next = checked ? [...current, name] : current.filter((n) => n !== name);
      return { ...prev, [role.id]: next };
    });
  };

  const toggleGroup = (role: RoleWithPermissions, togglableNames: string[], checked: boolean) => {
    setDraft((prev) => ({
      ...prev,
      [role.id]: toggleGroupPermissions(prev[role.id] ?? role.permissions, togglableNames, checked),
    }));
  };

  const save = async () => {
    if (!currentRole) {
      return;
    }
    setSaving(true);
    const response = await kyInstance.put(`roles/${currentRole.id}/permissions`, {
      json: { permissions: draftFor(currentRole) },
    });
    if (response.ok) {
      const updated = await response.json<RoleWithPermissions>();
      setRoles((prev) => prev.map((role) => (role.id === updated.id ? updated : role)));
      discardDraft(updated.id);
      message.success("Permisos actualizados.");
    } else {
      message.error(await extractErrorMessage(response, "No se pudieron guardar los permisos."));
    }
    setSaving(false);
  };

  const deleteRole = async (role: RoleWithPermissions) => {
    const response = await kyInstance.delete(`roles/${role.id}`);
    if (!response.ok) {
      message.error(await extractErrorMessage(response, "No se pudo eliminar el rol."));
      return;
    }
    message.success("Rol eliminado.");
    const next = roles.filter((r) => r.id !== role.id);
    setRoles(next);
    if (selectedRoleId === role.id) {
      setSelectedRoleId(next[0]?.id ?? null);
    }
  };

  const openCreateModal = () => {
    roleForm.resetFields();
    setRoleModal({ mode: "create" });
  };

  const openRenameModal = (role: RoleWithPermissions) => {
    roleForm.setFieldsValue({ name: role.name });
    setRoleModal({ mode: "rename", role });
  };

  const submitRoleModal = async () => {
    let values: { name: string };
    try {
      values = await roleForm.validateFields();
    } catch {
      return;
    }

    setRoleModalSaving(true);
    const response =
      roleModal?.mode === "rename"
        ? await kyInstance.patch(`roles/${roleModal.role.id}`, { json: values })
        : await kyInstance.post("roles", { json: values });

    if (response.ok) {
      const role = await response.json<RoleWithPermissions>();
      if (roleModal?.mode === "rename") {
        setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, name: role.name } : r)));
        message.success("Rol renombrado.");
      } else {
        setRoles((prev) => [...prev, role].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedRoleId(role.id);
        message.success("Rol creado.");
      }
      setRoleModal(null);
    } else {
      roleForm.setFields([
        { name: "name", errors: [await extractErrorMessage(response, "No se pudo guardar el rol.")] },
      ]);
    }
    setRoleModalSaving(false);
  };

  const visibleRoles = useMemo(() => filterRolesByName(roles, roleSearch), [roles, roleSearch]);
  const { sistema, personalizados } = useMemo(() => splitRolesByType(visibleRoles), [visibleRoles]);

  const filteredPermissions = useMemo(
    () => filterPermissions(permissions, permissionSearch),
    [permissions, permissionSearch],
  );
  const groups = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);

  const roleSelectOptions = [
    { label: "Sistema", options: sistema.map((role) => ({ value: role.id, label: capitalize(role.name) })) },
    {
      label: "Personalizados",
      options: personalizados.map((role) => ({ value: role.id, label: capitalize(role.name) })),
    },
  ].filter((group) => group.options.length > 0);

  const renderRoleRow = (role: RoleWithPermissions) => (
    <button
      key={role.id}
      type="button"
      onClick={() => selectRole(role)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "none",
        borderRadius: 8,
        padding: "8px 10px",
        marginBottom: 2,
        cursor: "pointer",
        background: role.id === selectedRoleId ? "#d6ebff" : "transparent",
        boxShadow: role.id === selectedRoleId ? "inset 3px 0 0 0 #1677ff" : "none",
      }}
    >
      <Badge dot={isDirty(role)} offset={[3, 3]}>
        <Text strong={role.id === selectedRoleId}>{capitalize(role.name)}</Text>
      </Badge>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {role.personas_count} personas · {role.permissions.length} permisos
        </Text>
      </div>
    </button>
  );

  return (
    <List
      title="Roles y permisos"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Nuevo rol
        </Button>
      }
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexDirection: isCompact ? "column" : "row" }}>
        {isCompact ? (
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Elegí un rol"
            value={selectedRoleId ?? undefined}
            options={roleSelectOptions}
            optionFilterProp="label"
            loading={loading}
            onChange={(id: number) => {
              const role = roles.find((r) => r.id === id);
              if (role) {
                selectRole(role);
              }
            }}
          />
        ) : (
          <div
            style={{
              width: 280,
              flex: "0 0 280px",
              display: "flex",
              flexDirection: "column",
              maxHeight: PANEL_MAX_HEIGHT,
              border: "1px solid #f0f0f0",
              borderRadius: 8,
            }}
          >
            <div style={{ padding: 12, paddingBottom: 0 }}>
              <Input
                allowClear
                placeholder="Buscar rol..."
                prefix={<SearchOutlined />}
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />
            </div>
            <div
              style={{
                overflowY: "auto",
                margin: "0 12px 12px",
                padding: 12,
                background: "#eeeeee",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
              }}
            >
              {sistema.length > 0 && (
                <>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
                    Sistema
                  </Text>
                  {sistema.map(renderRoleRow)}
                </>
              )}
              {personalizados.length > 0 && (
                <>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, textTransform: "uppercase", marginTop: 12, display: "block" }}
                  >
                    Personalizados
                  </Text>
                  {personalizados.map(renderRoleRow)}
                </>
              )}
              {visibleRoles.length === 0 && <Empty description="Sin resultados" />}
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            maxHeight: PANEL_MAX_HEIGHT,
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            padding: 16,
          }}
        >
          {!currentRole ? (
            <Empty description={loading ? "Cargando..." : "Creá un rol para empezar"} />
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <Space align="center">
                    <Title level={4} style={{ margin: 0 }}>
                      {capitalize(currentRole.name)}
                    </Title>
                    <Tag color={currentRole.es_sistema ? "blue" : "default"}>
                      {currentRole.es_sistema ? "Sistema" : "Personalizado"}
                    </Tag>
                  </Space>
                  <div>
                    <Text type="secondary">{currentRole.personas_count} personas con este rol</Text>
                  </div>
                </div>
                <Space wrap>
                  {!currentRole.es_sistema && (
                    <>
                      <Button onClick={() => openRenameModal(currentRole)}>Renombrar</Button>
                      <Popconfirm
                        title="¿Eliminar este rol?"
                        description={`${currentRole.personas_count} personas tienen este rol y lo van a perder.`}
                        okText="Eliminar"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteRole(currentRole)}
                      >
                        <Button danger>Eliminar</Button>
                      </Popconfirm>
                    </>
                  )}
                  <Button type="primary" loading={saving} disabled={!isDirty(currentRole)} onClick={save}>
                    Guardar cambios
                  </Button>
                </Space>
              </div>

              {(() => {
                const summary = permissionsSummary(draftFor(currentRole), permissions);
                const percent = summary.total === 0 ? 0 : Math.round((summary.count / summary.total) * 100);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <Text>
                      {summary.count} de {summary.total} permisos asignados
                    </Text>
                    <Progress percent={percent} showInfo={false} style={{ maxWidth: 200, flex: 1 }} />
                    <Text type="secondary">{percent}%</Text>
                  </div>
                );
              })()}

              <Input
                allowClear
                placeholder="Buscar recurso o permiso..."
                prefix={<SearchOutlined />}
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                style={{ marginBottom: 16, maxWidth: 360 }}
              />

              <div
                style={{
                  overflowY: "auto",
                  flex: 1,
                  minHeight: 0,
                  background: "#eeeeee",
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                {Object.keys(groups).length === 0 ? (
                  <Empty description="No se encontraron recursos." />
                ) : (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {Object.entries(groups).map(([group, items]) => {
                      const names = items.map((item) => item.name);
                      const state = groupCheckboxState(currentRole, names, draftFor(currentRole));
                      return (
                        <div
                          key={group}
                          style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, background: "#fff" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                              gap: 12,
                            }}
                          >
                            <Text strong>{items[0]?.group_label ?? group}</Text>
                            <Space>
                              <Text type="secondary">
                                {state.activeCount}/{state.total}
                              </Text>
                              <Checkbox
                                checked={state.checked}
                                indeterminate={state.indeterminate}
                                disabled={state.disabled}
                                onChange={(e) => toggleGroup(currentRole, state.togglableNames, e.target.checked)}
                              >
                                Todos
                              </Checkbox>
                            </Space>
                          </div>
                          <Space wrap size={[16, 8]}>
                            {items.map((permission) => {
                              const locked = isPermissionLocked(currentRole, permission.name);
                              const checked = locked || draftFor(currentRole).includes(permission.name);
                              const checkbox = (
                                <Checkbox
                                  checked={checked}
                                  disabled={locked}
                                  onChange={(e) => toggle(currentRole, permission.name, e.target.checked)}
                                >
                                  {permission.short_label}
                                  {locked && <LockOutlined style={{ marginLeft: 6, color: "rgba(0,0,0,.35)" }} />}
                                </Checkbox>
                              );
                              return locked ? (
                                <Tooltip key={permission.name} title="Permiso obligatorio de este rol">
                                  {checkbox}
                                </Tooltip>
                              ) : (
                                <span key={permission.name}>{checkbox}</span>
                              );
                            })}
                          </Space>
                        </div>
                      );
                    })}
                  </Space>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={roleModal?.mode === "rename" ? "Renombrar rol" : "Nuevo rol"}
        open={roleModal !== null}
        onCancel={() => setRoleModal(null)}
        onOk={submitRoleModal}
        confirmLoading={roleModalSaving}
        okText="Guardar"
        destroyOnClose
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
            <Input maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
