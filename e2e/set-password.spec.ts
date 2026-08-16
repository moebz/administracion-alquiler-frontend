import { expect, test, type APIRequestContext } from "@playwright/test";
import { loginAsAdminApi, uniqueEmail } from "./support/api";
import { createAndActivateUser, loginViaUi } from "./support/flows";
import { getLatestUpdatePasswordLink } from "./support/mail-log";

// Flujo de punta a punta descripto en DECISIONES.md ("Flujo compartido de
// invitación y recuperación de contraseña"): misma pantalla /update-password
// y mismo endpoint /set-password para los dos casos.
test.describe("invitacion y recuperacion de contrasena", () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginAsAdminApi();
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test("invitacion: el usuario invitado elige su contrasena y puede loguearse", async ({
    page,
  }) => {
    const { user, password } = await createAndActivateUser(
      page,
      admin,
      "invitacion-password-123",
      { email: uniqueEmail("invitation") },
    );

    await loginViaUi(page, user.email, password);

    await expect(page).toHaveURL(/\/propietario\/home/);
  });

  test("recuperacion: un usuario ya activo pide 'olvide mi contrasena' y puede loguearse con la nueva", async ({
    page,
  }) => {
    // Se activa primero con una contraseña inicial (no se toca ninguna
    // cuenta seedeada compartida, para no romper otros tests).
    const { user } = await createAndActivateUser(page, admin, "password-inicial-123", {
      email: uniqueEmail("recovery"),
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("button", { name: "Send reset instructions" }).click();

    const recoveryLink = await getLatestUpdatePasswordLink(user.email);
    const newPassword = "password-recuperada-456";

    await page.goto(recoveryLink);
    await page.getByLabel("New Password").fill(newPassword);
    await page.getByLabel("Confirm New Password").fill(newPassword);
    await page.getByRole("button", { name: "Update" }).click();
    await expect(page).toHaveURL(/\/login/);

    await loginViaUi(page, user.email, newPassword);

    await expect(page).toHaveURL(/\/propietario\/home/);
  });

  test("un link invalido muestra un error claro", async ({ page }) => {
    await page.goto("/update-password?token=token-invalido&email=nadie@inmova.test");

    await page.getByLabel("New Password").fill("cualquier-password-123");
    await page.getByLabel("Confirm New Password").fill("cualquier-password-123");
    await page.getByRole("button", { name: "Update" }).click();

    await expect(page.getByText(/link no es válido o venció/i)).toBeVisible();
  });
});
