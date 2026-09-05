import { describe, expect, it } from "vitest";
import { requiredPermission } from "./access-control";

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
    expect(requiredPermission("tipos-documento", "list")).toBe("tipos_documento.ver");
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

  it("devuelve null para resources agrupadores sin permisos propios", () => {
    expect(requiredPermission("catalogos", "list")).toBeNull();
  });

  it("devuelve null para resources desconocidos", () => {
    expect(requiredPermission("algo-inventado", "list")).toBeNull();
  });
});
