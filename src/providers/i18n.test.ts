import { describe, expect, it } from "vitest";
import { i18nProvider } from "./i18n";

describe("i18nProvider.translate, titulos de resource", () => {
  it("traduce el titulo de edit de cualquier resource, sin necesitar una clave especifica para el", () => {
    expect(i18nProvider.translate("propiedades.titles.edit", undefined, "Edit Propiedad")).toBe(
      "Editar Propiedad",
    );
  });

  it("traduce el titulo de create", () => {
    expect(i18nProvider.translate("users.titles.create", undefined, "Create Usuario")).toBe(
      "Crear Usuario",
    );
  });

  it("traduce el titulo de show reusando el mismo texto que el boton Ver", () => {
    expect(i18nProvider.translate("users.titles.show", undefined, "Show Usuario")).toBe("Ver Usuario");
  });

  it("no toca claves que no son titulos de resource", () => {
    expect(i18nProvider.translate("notifications.success", undefined, "Ready")).toBe("Listo");
  });
});
