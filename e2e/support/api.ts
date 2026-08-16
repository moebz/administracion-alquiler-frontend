import { type APIRequestContext, request } from "@playwright/test";

const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://api.inmova.test:2090/api";

// Mismas credenciales que crea `RoleSeeder` (ver backend/database/seeders/RoleSeeder.php).
// La password sale de DEFAULT_SEED_PASSWORD en backend/.env — si tu .env local
// tiene un valor custom (no el default "password"), pasalo por env var:
// `SEED_PASSWORD=<valor> npx playwright test` (ver e2e/README.md).
export const SEED_ADMIN_EMAIL = "administrador@inmova.test";
export const SEED_PROPIETARIO_EMAIL = "propietario@inmova.test";
export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "password";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
  password_set_at: string | null;
};

/** Email único por corrida — evita colisiones entre tests o entre corridas sucesivas. */
export const uniqueEmail = (label: string): string =>
  `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@inmova.test`;

const newApiContext = (extraHTTPHeaders?: Record<string, string>) =>
  request.newContext({ baseURL: API_URL, extraHTTPHeaders });

/**
 * Loguea vía API como el admin seedeado y devuelve un `APIRequestContext` con
 * el Bearer token ya seteado — usado para armar datos de prueba sin pasar por
 * la UI (mismo criterio que "usar la API para el setup, la UI para lo que se
 * está testeando" del resto de la suite).
 */
export const loginAsAdminApi = async (): Promise<APIRequestContext> => {
  const anon = await newApiContext();
  const response = await anon.post("login", {
    data: { email: SEED_ADMIN_EMAIL, password: SEED_PASSWORD },
  });

  if (!response.ok()) {
    await anon.dispose();
    throw new Error(
      `No se pudo loguear como admin seedeado (${SEED_ADMIN_EMAIL}) — ¿corriste ` +
        `el RoleSeeder? ¿SEED_PASSWORD matchea DEFAULT_SEED_PASSWORD del backend? ` +
        `Status: ${response.status()}`,
    );
  }

  const { token } = (await response.json()) as { token: string };
  await anon.dispose();

  return newApiContext({ Authorization: `Bearer ${token}` });
};

export const createUserViaApi = async (
  admin: APIRequestContext,
  overrides: Partial<{ name: string; email: string; roles: string[] }> = {},
): Promise<ApiUser> => {
  const response = await admin.post("users", {
    data: {
      name: overrides.name ?? "Usuario E2E",
      email: overrides.email ?? uniqueEmail("user"),
      roles: overrides.roles ?? ["propietario"],
    },
  });

  if (!response.ok()) {
    throw new Error(`No se pudo crear el usuario de prueba vía API: ${response.status()}`);
  }

  return (await response.json()) as ApiUser;
};

export const deactivateUserViaApi = (admin: APIRequestContext, userId: number) =>
  admin.patch(`users/${userId}/deactivate`);
