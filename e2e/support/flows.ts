import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { createUserViaApi, type ApiUser } from "./api";
import { getLatestUpdatePasswordLink } from "./mail-log";

/** Login por UI — mismo formulario que usa cualquier persona real. */
export const loginViaUi = async (page: Page, email: string, password: string): Promise<void> => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
};

/**
 * Completa el paso final de "elegir contraseña" a través de la UI real —
 * misma pantalla para invitación y recuperación (ver ARQUITECTURA.md, "Flujo
 * compartido de invitación y recuperación de contraseña").
 */
export const setPasswordViaUi = async (page: Page, link: string, password: string): Promise<void> => {
  await page.goto(link);
  await page.getByLabel("Nueva contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar nueva contraseña").fill(password);
  await page.getByRole("button", { name: "Actualizar" }).click();
};

/**
 * Crea un usuario vía API (invitación disparada del lado del backend) y
 * completa el flujo real de activación a través de la UI — exactamente lo
 * mismo que haría la persona invitada al clickear el link del mail. Devuelve
 * el usuario y la contraseña elegida, listos para loguearse.
 */
export const createAndActivateUser = async (
  page: Page,
  admin: APIRequestContext,
  password: string,
  overrides: Partial<{ name: string; email: string; roles: string[] }> = {},
): Promise<{ user: ApiUser; password: string }> => {
  const user = await createUserViaApi(admin, overrides);
  const link = await getLatestUpdatePasswordLink(user.email);

  await setPasswordViaUi(page, link, password);
  await expect(page).toHaveURL(/\/login/);

  return { user, password };
};
