import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  createUserViaApi,
  loginAsAdminApi,
  SEED_ADMIN_EMAIL,
  SEED_PASSWORD,
  SEED_PROPIETARIO_EMAIL,
  uniqueDocumento,
  uniqueEmail,
} from "./support/api";
import { loginViaUi } from "./support/flows";

test.describe("ABM de personas y cuentas (admin)", () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginAsAdminApi();
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test("un no-admin no puede entrar a la seccion de personas", async ({ page }) => {
    await loginViaUi(page, SEED_PROPIETARIO_EMAIL, SEED_PASSWORD);
    await expect(page).toHaveURL(/\/propietario\/home/);

    await page.goto("/administrador/personas");

    // RoleRoute lo manda a su propio home, nunca le muestra la pantalla
    // (ver ARQUITECTURA.md, "Rol activo: se resuelve por la URL").
    await expect(page).toHaveURL(/\/propietario\/home/);
  });

  test("el admin crea una persona con rol y despues le crea la cuenta desde el listado", async ({
    page,
  }) => {
    const documento = uniqueDocumento();

    await loginViaUi(page, SEED_ADMIN_EMAIL, SEED_PASSWORD);
    await expect(page).toHaveURL(/\/administrador\/home/);
    await page.goto("/administrador/personas/create");

    await page.getByLabel("Tipo de documento").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Documento").fill(documento);
    await page.getByLabel("Nombre").fill("Creado desde Playwright");
    // Select multiple de antd: click abre el dropdown, se elige la opción por texto.
    await page.getByLabel("Roles").click();
    await page.getByTitle("propietario", { exact: true }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page).toHaveURL(/\/administrador\/personas$/);

    const row = page.getByRole("row", { name: new RegExp(documento) });
    await expect(row).toBeVisible();
    await expect(row.getByText("Sin cuenta")).toBeVisible();

    const email = uniqueEmail("create-ui");
    await row.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/administrador\/usuarios\/create\?persona_id=\d+$/);
    await expect(page.getByText("Creado desde Playwright")).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/administrador\/personas$/);
    const rowConCuenta = page.getByRole("row", { name: new RegExp(email) });
    await expect(rowConCuenta.getByText("Invitado · pendiente")).toBeVisible();
  });

  test("el admin desactiva y reactiva la cuenta de una persona desde el listado", async ({ page }) => {
    const user = await createUserViaApi(admin, { email: uniqueEmail("toggle") });

    await loginViaUi(page, SEED_ADMIN_EMAIL, SEED_PASSWORD);
    await expect(page).toHaveURL(/\/administrador\/home/);
    await page.goto("/administrador/personas");

    const row = page.getByRole("row", { name: new RegExp(user.email) });
    await expect(row.getByText("Invitado · pendiente")).toBeVisible();

    await row.getByRole("button", { name: "Desactivar cuenta" }).click();
    await expect(row.getByText("Inactivo")).toBeVisible();

    await row.getByRole("button", { name: "Activar cuenta" }).click();
    await expect(row.getByText("Invitado · pendiente")).toBeVisible();
  });

  test("el admin desactiva una persona y su cuenta queda desactivada en cascada", async ({ page }) => {
    const user = await createUserViaApi(admin, { email: uniqueEmail("cascade") });

    await loginViaUi(page, SEED_ADMIN_EMAIL, SEED_PASSWORD);
    await page.goto("/administrador/personas");

    const row = page.getByRole("row", { name: new RegExp(user.email) });
    await row.getByRole("button", { name: "Desactivar persona" }).click();
    await page.getByRole("button", { name: "Desactivar", exact: true }).click();

    await expect(row.getByText("Inactiva")).toBeVisible();
    await expect(row.getByText("Inactivo")).toBeVisible();
  });
});
