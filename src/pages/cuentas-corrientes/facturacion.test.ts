import { describe, expect, it } from "vitest";
import { permisosFaltantes } from "./facturacion";

describe("permisosFaltantes", () => {
  it("devuelve vacio si el usuario tiene todos los permisos", () => {
    expect(permisosFaltantes(["liquidaciones.facturar", "facturas.emitir"], ["facturas.emitir", "liquidaciones.facturar"])).toEqual([]);
  });

  it("devuelve el permiso de NC cuando la vista previa trae NC y el usuario no puede emitirlas", () => {
    const requeridos = ["liquidaciones.facturar", "facturas.emitir", "facturas.emitir_nc"];

    expect(permisosFaltantes(requeridos, ["liquidaciones.facturar", "facturas.emitir"])).toEqual(["facturas.emitir_nc"]);
  });

  it("devuelve todos los permisos si todavia no se cargaron los del usuario", () => {
    expect(permisosFaltantes(["facturas.emitir"], undefined)).toEqual(["facturas.emitir"]);
  });
});
