import { describe, expect, it } from "vitest";
import { canAccessResource, requiredPermission } from "./access-control";

describe("requiredPermission", () => {
  it("resuelve list/show a .ver, create a .crear, edit a .editar y delete a .gestionar_estado", () => {
    expect(requiredPermission("bancos", "list")).toBe("bancos.ver");
    expect(requiredPermission("bancos", "show")).toBe("bancos.ver");
    expect(requiredPermission("bancos", "create")).toBe("bancos.crear");
    expect(requiredPermission("bancos", "edit")).toBe("bancos.editar");
    expect(requiredPermission("bancos", "delete")).toBe("bancos.gestionar_estado");
  });

  it("resuelve cada alias de resource a su grupo de permisos real", () => {
    expect(requiredPermission("personas-todos", "list")).toBe("personas.ver");
    expect(requiredPermission("personas", "create")).toBe("personas.crear");
    expect(requiredPermission("users", "edit")).toBe("usuarios.editar");
    expect(requiredPermission("contratos-alquiler", "list")).toBe("contratos_alquiler.ver");
    expect(requiredPermission("tipos-identificacion", "list")).toBe("tipos_identificacion.ver");
    expect(requiredPermission("tipos-relacion", "list")).toBe("tipos_relacion.ver");
    expect(requiredPermission("edificios-todos", "list")).toBe("edificios.ver");
    expect(requiredPermission("proveedores-todos", "list")).toBe("proveedores.ver");
  });

  it("resuelve roles y permisos a roles.administrar sin importar la accion", () => {
    expect(requiredPermission("roles", "list")).toBe("roles.administrar");
    expect(requiredPermission("roles", "create")).toBe("roles.administrar");
    expect(requiredPermission("roles", "delete")).toBe("roles.administrar");
    expect(requiredPermission("permisos", "list")).toBe("roles.administrar");
  });

  it("resuelve gastos a un unico permiso (solicitar) para crear y editar", () => {
    expect(requiredPermission("gastos", "list")).toBe("gastos.ver");
    expect(requiredPermission("gastos", "create")).toBe("gastos.solicitar");
    expect(requiredPermission("gastos", "edit")).toBe("gastos.solicitar");
  });

  it("resuelve catalogos (agrupador sin permiso propio) a acceso.administrador", () => {
    expect(requiredPermission("catalogos", "list")).toBe("acceso.administrador");
  });

  it("devuelve null para resources agrupadores sin entrada en FIXED_PERMISSION", () => {
    expect(requiredPermission("algo-agrupador-sin-declarar", "list")).toBeNull();
  });

  it("devuelve null para resources desconocidos", () => {
    expect(requiredPermission("algo-inventado", "list")).toBeNull();
  });

  it("resuelve las pantallas de propietario a un unico permiso sin importar la accion", () => {
    expect(requiredPermission("propietario/gastos", "list")).toBe("gastos.aprobar_propio");
    expect(requiredPermission("propietario/gastos", "edit")).toBe("gastos.aprobar_propio");
  });
});

describe("canAccessResource", () => {
  it("deniega un recurso con su permiso propio si falta el acceso a la seccion", () => {
    expect(canAccessResource(["edificios.ver"], "edificios", "list")).toBe(false);
  });

  it("permite un recurso con su permiso propio y el acceso a la seccion", () => {
    expect(canAccessResource(["edificios.ver", "acceso.administrador"], "edificios", "list")).toBe(true);
  });

  it("deniega si tiene el acceso a la seccion pero no el permiso del recurso", () => {
    expect(canAccessResource(["acceso.administrador"], "edificios", "list")).toBe(false);
  });

  it("permite sin chequear nada para un resource agrupador sin entrada en FIXED_PERMISSION", () => {
    expect(canAccessResource([], "algo-agrupador-sin-declarar", "list")).toBe(true);
  });

  it("deniega catalogos (agrupador admin-only) a quien no tiene acceso.administrador", () => {
    expect(canAccessResource(["acceso.propietario"], "catalogos", "list")).toBe(false);
    expect(canAccessResource([], "catalogos", "list")).toBe(false);
  });

  it("permite catalogos a quien tiene acceso.administrador", () => {
    expect(canAccessResource(["acceso.administrador"], "catalogos", "list")).toBe(true);
  });

  it("un resource de la seccion propietario pide el acceso de esa seccion, no el de administrador", () => {
    expect(canAccessResource(["gastos.aprobar_propio", "acceso.propietario"], "propietario/gastos", "list")).toBe(
      true,
    );
    expect(canAccessResource(["gastos.aprobar_propio", "acceso.administrador"], "propietario/gastos", "list")).toBe(
      false,
    );
    expect(canAccessResource(["acceso.propietario"], "propietario/gastos", "list")).toBe(false);
  });
});
