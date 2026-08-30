import { type APIRequestContext, request } from "@playwright/test";

// Barra final a propósito: `request.newContext({ baseURL })` resuelve paths
// relativos ("login", "users/...") con la regla estándar de URL — sin la
// barra, el último segmento ("api") se pisa en vez de conservarse y las
// requests terminan pegándole a `/login` en vez de `/api/login` (404 en
// todos los tests). Si se pisa por env var, mantener la barra final.
const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://api.inmova.test:2090/api/";

// Mismas credenciales que crea `RoleSeeder` (ver backend/database/seeders/RoleSeeder.php).
// La password sale de DEFAULT_SEED_PASSWORD en backend/.env — si tu .env local
// tiene un valor custom (no el default "password"), pasalo por env var:
// `SEED_PASSWORD=<valor> npx playwright test` (ver e2e/README.md).
export const SEED_ADMIN_EMAIL = "administrador@inmova.test";
export const SEED_PROPIETARIO_EMAIL = "propietario@inmova.test";
export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "password";

export type ApiPersona = {
  id: number;
  nombre: string;
  documento: string;
  roles: string[];
  is_active: boolean;
};

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  password_set_at: string | null;
};

/** Email único por corrida — evita colisiones entre tests o entre corridas sucesivas. */
export const uniqueEmail = (label: string): string =>
  `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@inmova.test`;

/** Documento único por corrida — mismo criterio que uniqueEmail. */
export const uniqueDocumento = (): string => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

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

let cachedTipoDocumentoId: number | undefined;

/** Cualquier tipo de documento seedeado sirve — se cachea para no repetir el GET. */
const getTipoDocumentoId = async (admin: APIRequestContext): Promise<number> => {
  if (cachedTipoDocumentoId !== undefined) {
    return cachedTipoDocumentoId;
  }

  const response = await admin.get("tipos-documento");
  if (!response.ok()) {
    throw new Error(`No se pudo listar tipos de documento vía API: ${response.status()}`);
  }

  const tipos = (await response.json()) as { id: number }[];
  if (tipos.length === 0) {
    throw new Error("No hay tipos de documento seedeados — ¿corriste TipoDocumentoSeeder?");
  }

  cachedTipoDocumentoId = tipos[0].id;
  return cachedTipoDocumentoId;
};

/**
 * Crea una persona vía API, con rol asignado (el ABM de personas es donde
 * ahora vive el rol — ver CHECKLIST-roles-personas.md).
 */
export const createPersonaViaApi = async (
  admin: APIRequestContext,
  overrides: Partial<{ nombre: string; documento: string; roles: string[] }> = {},
): Promise<ApiPersona> => {
  const response = await admin.post("personas", {
    data: {
      tipo_documento_id: await getTipoDocumentoId(admin),
      documento: overrides.documento ?? uniqueDocumento(),
      nombre: overrides.nombre ?? "Persona E2E",
      roles: overrides.roles ?? ["propietario"],
    },
  });

  if (!response.ok()) {
    throw new Error(`No se pudo crear la persona de prueba vía API: ${response.status()}`);
  }

  return (await response.json()) as ApiPersona;
};

/**
 * Crea una persona y le da de alta la cuenta (dos pasos, mismo contrato que
 * la UI: la cuenta es un sub-recurso de una persona ya existente).
 */
export const createUserViaApi = async (
  admin: APIRequestContext,
  overrides: Partial<{ name: string; email: string; roles: string[] }> = {},
): Promise<ApiUser> => {
  const persona = await createPersonaViaApi(admin, { nombre: overrides.name, roles: overrides.roles });

  const response = await admin.post("users", {
    data: {
      persona_id: persona.id,
      email: overrides.email ?? uniqueEmail("user"),
    },
  });

  if (!response.ok()) {
    throw new Error(`No se pudo crear el usuario de prueba vía API: ${response.status()}`);
  }

  return (await response.json()) as ApiUser;
};

export const deactivateUserViaApi = (admin: APIRequestContext, userId: number) =>
  admin.patch(`users/${userId}/deactivate`);
