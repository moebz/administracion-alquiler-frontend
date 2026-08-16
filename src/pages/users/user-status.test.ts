import { describe, expect, it } from "vitest";
import { getUserStatus, USER_STATUS_COLOR, USER_STATUS_LABEL } from "./user-status";

describe("getUserStatus", () => {
  it("es 'inactive' si is_active es false, sin importar password_set_at", () => {
    expect(getUserStatus({ is_active: false, password_set_at: null })).toBe("inactive");
    expect(getUserStatus({ is_active: false, password_set_at: "2026-08-16T00:00:00Z" })).toBe(
      "inactive",
    );
  });

  it("es 'invited' si esta activo pero nunca puso su contrasena", () => {
    expect(getUserStatus({ is_active: true, password_set_at: null })).toBe("invited");
  });

  it("es 'active' si esta activo y ya puso su contrasena", () => {
    expect(getUserStatus({ is_active: true, password_set_at: "2026-08-16T00:00:00Z" })).toBe(
      "active",
    );
  });
});

describe("USER_STATUS_LABEL / USER_STATUS_COLOR", () => {
  it("tienen una entrada para cada estado posible", () => {
    const statuses = ["invited", "active", "inactive"] as const;
    for (const status of statuses) {
      expect(USER_STATUS_LABEL[status]).toBeTruthy();
      expect(USER_STATUS_COLOR[status]).toBeTruthy();
    }
  });
});
