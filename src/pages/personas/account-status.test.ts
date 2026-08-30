import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS_COLOR, ACCOUNT_STATUS_LABEL, getAccountStatus } from "./account-status";

describe("getAccountStatus", () => {
  it("es 'sin_cuenta' si la persona no tiene usuario", () => {
    expect(getAccountStatus(null)).toBe("sin_cuenta");
  });

  it("es 'inactivo' si is_active es false, sin importar password_set_at", () => {
    expect(getAccountStatus({ id: 1, email: "a@b.com", is_active: false, password_set_at: null })).toBe(
      "inactivo",
    );
    expect(
      getAccountStatus({
        id: 1,
        email: "a@b.com",
        is_active: false,
        password_set_at: "2026-08-16T00:00:00Z",
      }),
    ).toBe("inactivo");
  });

  it("es 'invitado' si esta activo pero nunca puso su contrasena", () => {
    expect(getAccountStatus({ id: 1, email: "a@b.com", is_active: true, password_set_at: null })).toBe(
      "invitado",
    );
  });

  it("es 'activo' si esta activo y ya puso su contrasena", () => {
    expect(
      getAccountStatus({
        id: 1,
        email: "a@b.com",
        is_active: true,
        password_set_at: "2026-08-16T00:00:00Z",
      }),
    ).toBe("activo");
  });
});

describe("ACCOUNT_STATUS_LABEL / ACCOUNT_STATUS_COLOR", () => {
  it("tienen una entrada para cada estado posible", () => {
    const statuses = ["sin_cuenta", "invitado", "activo", "inactivo"] as const;
    for (const status of statuses) {
      expect(ACCOUNT_STATUS_LABEL[status]).toBeTruthy();
      expect(ACCOUNT_STATUS_COLOR[status]).toBeTruthy();
    }
  });
});
