import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  createUserViaApi,
  deactivateUserViaApi,
  loginAsAdminApi,
  SEED_ADMIN_EMAIL,
  SEED_PASSWORD,
  uniqueEmail,
} from "./support/api";
import { createAndActivateUser, loginViaUi } from "./support/flows";

test.describe("login", () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginAsAdminApi();
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test("un login correcto redirige al home del rol", async ({ page }) => {
    await loginViaUi(page, SEED_ADMIN_EMAIL, SEED_PASSWORD);

    await expect(page).toHaveURL(/\/administrador\/home/);
    await expect(page.getByText(/administrador/i)).toBeVisible();
  });

  test("password incorrecta muestra un error generico", async ({ page }) => {
    await loginViaUi(page, SEED_ADMIN_EMAIL, "definitivamente-no-es-la-password");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/email o la contraseña son incorrectos/i)).toBeVisible();
  });

  test("una cuenta que nunca activo su contrasena muestra un mensaje especifico", async ({
    page,
  }) => {
    // Se crea vía API y nunca se completa /update-password — password_set_at
    // queda null (ver PROGRESO.md, checklist de CRUD de usuarios).
    const user = await createUserViaApi(admin, { email: uniqueEmail("never-activated") });

    await loginViaUi(page, user.email, "cualquier-cosa");

    await expect(page.getByText(/Todavía no activaste tu cuenta/i)).toBeVisible();
  });

  test("una cuenta desactivada muestra un mensaje especifico", async ({ page }) => {
    const { user, password } = await createAndActivateUser(page, admin, "una-password-valida-123");
    await deactivateUserViaApi(admin, user.id);

    await loginViaUi(page, user.email, password);

    await expect(page.getByText(/Tu cuenta está desactivada/i)).toBeVisible();
  });
});
