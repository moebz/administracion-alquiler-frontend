import type { AuthProvider } from "@refinedev/core";
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

    const body = await response.json<{ message?: string }>().catch(() => null);

    return {
      success: false,
      error: {
        name: "LoginError",
        message: body?.message ?? "Usuario o contraseña inválidos",
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
