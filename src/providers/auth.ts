import type { AuthProvider } from "@refinedev/core";
import type { KyResponse } from "ky";
import { TOKEN_KEY } from "./constants";
import { kyInstance } from "./data";
import { getPriorityRole, roleHomePath } from "./roles";

type LoginResponse = {
  token: string;
  user: UserResponse;
};

type UserResponse = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

/**
 * Lee `token`/`email` de la URL — usado por `updatePassword`. `authProvider`
 * son funciones planas (no componentes), así que no puede usar hooks de
 * router; pero como es JS común, `window.location.search` funciona igual.
 * Función pura y exportada aparte para poder testearla sola el día que el
 * proyecto tenga un test runner de frontend.
 */
export const parseUpdatePasswordParams = (
  search: string,
): { token: string | null; email: string | null } => {
  const params = new URLSearchParams(search);
  return { token: params.get("token"), email: params.get("email") };
};

/**
 * Mensaje de error legible a partir de una respuesta de `ky` (creado con
 * `throwHttpErrors: false`, así que un 4xx/5xx no tira excepción). Misma
 * función para los tres flujos de auth que necesitan mapear un body de
 * error del backend a un mensaje para el usuario.
 */
export const extractErrorMessage = async (
  response: KyResponse,
  fallback: string,
): Promise<string> => {
  const body = await response
    .json<{ message?: string }>()
    .catch(() => null);
  return body?.message ?? fallback;
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const response = await kyInstance.post("login", {
      json: { email, password },
    });

    if (response.ok) {
      const { token, user } = await response.json<LoginResponse>();
      localStorage.setItem(TOKEN_KEY, token);

      const priorityRole = getPriorityRole(user.roles);
      return {
        success: true,
        redirectTo: priorityRole ? roleHomePath(priorityRole) : "/",
      };
    }

    return {
      success: false,
      error: {
        name: "LoginError",
        message: await extractErrorMessage(response, "Usuario o contraseña inválidos"),
      },
    };
  },
  logout: async () => {
    if (localStorage.getItem(TOKEN_KEY)) {
      // Revoca el token del lado del backend; si falla igual limpiamos localStorage.
      await kyInstance.post("logout").catch(() => undefined);
    }

    localStorage.removeItem(TOKEN_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    const response = await kyInstance.get("user");
    if (response.ok) {
      return {
        authenticated: true,
      };
    }

    localStorage.removeItem(TOKEN_KEY);
    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  // "Olvidé mi contraseña" self-service — reusa la pantalla /forgot-password
  // ya scaffoldeada por Refine, solo hacía falta conectar el provider.
  forgotPassword: async ({ email }) => {
    // Best-effort: la respuesta del backend ya es genérica (no filtra si el
    // email existe), así que no hay nada distinto que hacer en error vs éxito.
    await kyInstance.post("forgot-password", { json: { email } }).catch(() => undefined);

    return {
      success: true,
      successNotification: {
        message: "Listo",
        description: "Si el email existe, te enviamos un link para elegir tu contraseña.",
      },
    };
  },
  // Paso final compartido por invitación de alta (admin) y recuperación
  // self-service (arriba) — mismo endpoint, misma pantalla /update-password.
  // Ver DECISIONES.md, "Alta de usuarios".
  updatePassword: async ({ password }) => {
    const { token, email } = parseUpdatePasswordParams(window.location.search);

    if (!token || !email) {
      return {
        success: false,
        error: {
          name: "UpdatePasswordError",
          message: "Este link no es válido o venció. Pedí que te reenvíen la invitación o el mail de recuperación.",
        },
      };
    }

    const response = await kyInstance.post("set-password", {
      json: { email, token, password, password_confirmation: password },
    });

    if (response.ok) {
      return {
        success: true,
        redirectTo: "/login",
        successNotification: {
          message: "Contraseña creada",
          description: "Ya podés iniciar sesión con tu contraseña nueva.",
        },
      };
    }

    return {
      success: false,
      error: {
        name: "UpdatePasswordError",
        message: await extractErrorMessage(response, "Este link no es válido o venció."),
      },
    };
  },
  getIdentity: async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return null;
    }

    const response = await kyInstance.get("user");
    if (!response.ok) {
      return null;
    }

    const user = await response.json<UserResponse>();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
