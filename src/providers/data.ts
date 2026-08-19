import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";
import type { DataProvider, HttpError } from "@refinedev/core";
import { API_URL, TOKEN_KEY } from "./constants";

export const { dataProvider: baseDataProvider, kyInstance } = createSimpleRestDataProvider({
  apiURL: API_URL,
  kyOptions: {
    hooks: {
      beforeRequest: [
        (request) => {
          const token = localStorage.getItem(TOKEN_KEY);
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        },
      ],
    },
  },
});

/**
 * El `transformError` default de `createSimpleRestDataProvider` (create/
 * update/deleteOne) empaqueta la respuesta entera del backend como
 * `JSON.stringify({...body, variables, id})` dentro de `message` — sirve
 * para debug pero no para mostrarlo tal cual en una notificación (queda un
 * blob de JSON) ni en un campo de formulario. Acá se desarma ese blob para
 * devolver un `HttpError` "limpio": `message` legible para el toast de
 * notificación, y `errors` con la forma `{campo: string[]}` que ya manda
 * Laravel — `useForm` de `@refinedev/antd` lo mapea solo a cada campo del
 * formulario (ver DECISIONES.md, "Notificaciones de create/edit ya no
 * muestran un blob de JSON").
 */
const cleanHttpError = (error: unknown): HttpError => {
  const fallback: HttpError = { message: "Ocurrió un error inesperado.", statusCode: 500 };
  const raw = error as Partial<HttpError> | undefined;

  if (typeof raw?.message !== "string") {
    return fallback;
  }

  try {
    const body = JSON.parse(raw.message) as { message?: string; errors?: HttpError["errors"] };
    return {
      message: body.message ?? fallback.message,
      statusCode: raw.statusCode ?? fallback.statusCode,
      errors: body.errors,
    };
  } catch {
    // El body no era JSON (ej. un error de red que nunca llegó a
    // `transformError`) — se muestra tal cual en vez de perderlo.
    return { message: raw.message, statusCode: raw.statusCode ?? fallback.statusCode };
  }
};

export const dataProvider: DataProvider = {
  ...baseDataProvider,
  create: async (params) => {
    try {
      return await baseDataProvider.create(params);
    } catch (error) {
      throw cleanHttpError(error);
    }
  },
  update: async (params) => {
    try {
      return await baseDataProvider.update(params);
    } catch (error) {
      throw cleanHttpError(error);
    }
  },
  deleteOne: async (params) => {
    try {
      return await baseDataProvider.deleteOne(params);
    } catch (error) {
      throw cleanHttpError(error);
    }
  },
};
