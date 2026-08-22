import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  createUserViaApi,
  loginAsAdminApi,
  SEED_ADMIN_EMAIL,
  SEED_PASSWORD,
  SEED_PROPIETARIO_EMAIL,
  uniqueEmail,
} from "./support/api";
import { loginViaUi } from "./support/flows";

test.describe("ABM de usuarios (admin)", () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginAsAdminApi();
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test("un no-admin no puede entrar a la seccion de usuarios", async ({ page }) => {
    await loginViaUi(page, SEED_PROPIETARIO_EMAIL, SEED_PASSWORD);
    await expect(page).toHaveURL(/\/propietario\/home/);

    await page.goto("/administrador/usuarios");

    // RoleRoute lo manda a su propio home, nunca le muestra la pantalla
    // (ver ARQUITECTURA.md, "Rol activo: se resuelve por la URL").
    await expect(page).toHaveURL(/\/propietario\/home/);
  });

  test("el admin crea un usuario y lo ve en el listado como invitado pendiente", async ({
    page,
  }) => {
    const email = uniqueEmail("create-ui");

    await loginViaUi(page, SEED_ADMIN_EMAIL, SEED_PASSWORD);
    await expect(page).toHaveURL(/\/administrador\/home/);
    await page.goto("/administrador/usuarios/create");

    await page.getByLabel("Nombre").fill("Creado desde Playwright");
    await page.getByLabel("Email").fill(email);
    // Select multiple de antd: click abre el dropdown, se elige la opción por texto.
    await page.getByLabel("Roles").click();
    await page.getByTitle("propietario", { exact: true }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/administrador\/usuarios$/);
    const row = page.getByRole("row", { name: new RegExp(email) });
    await expect(row).toBeVisible();
    await expect(row.getByText("Invitado · pendiente")).toBeVisible();
  });

  test("el admin desactiva y reactiva a otro usuario desde el listado", async ({ page }) => {
    const user = await createUserViaApi(admin, { email: uniqueEmail("toggle") });

    await loginViaUi(page, SEED_ADMIN_EMAIL, SEED_PASSWORD);
    await expect(page).toHaveURL(/\/administrador\/home/);
    await page.goto("/administrador/usuarios");

    const row = page.getByRole("row", { name: new RegExp(user.email) });
    await expect(row.getByText("Invitado · pendiente")).toBeVisible();

    await row.getByRole("button", { name: "Desactivar" }).click();
    await expect(row.getByText("Inactivo")).toBeVisible();

    await row.getByRole("button", { name: "Activar" }).click();
    await expect(row.getByText("Invitado · pendiente")).toBeVisible();
  });
});
