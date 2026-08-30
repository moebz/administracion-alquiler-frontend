import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { I18nProvider } from "@refinedev/core";
import { APP_NAME } from "./constants";

/**
 * Traducciones de los textos que renderiza el propio Refine/@refinedev/antd
 * (botones, notificaciones, páginas de auth, título del documento) — no hay
 * un locale "es" oficial publicado, así que las claves se sacaron leyendo
 * cada `translate("clave", ...)` en el bundle compilado de @refinedev/core y
 * @refinedev/antd, para no perderse ninguna. Los textos propios del proyecto
 * (formularios, columnas, mensajes de negocio) ya están en español directo
 * en el JSX/backend y no pasan por acá.
 */
const es = {
  translation: {
    buttons: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Crear",
      show: "Ver",
      list: "Listado",
      clone: "Duplicar",
      refresh: "Actualizar",
      filter: "Filtrar",
      clear: "Limpiar",
      logout: "Cerrar sesión",
      confirm: "¿Estás seguro?",
      notAccessTitle: "No tenés permiso para acceder",
    },
    notifications: {
      success: "Listo",
      error: "Error (código {{statusCode}})",
      createSuccess: "Se creó {{resource}} con éxito",
      createError: "Hubo un error al crear {{resource}} (código {{statusCode}})",
      deleteSuccess: "Se eliminó {{resource}} con éxito",
      deleteError: "Error al eliminar {{resource}} (código {{statusCode}})",
      editSuccess: "Se editó {{resource}} con éxito",
      editError: "Error al editar {{resource}} (código {{statusCode}})",
      undoable: "Tenés {{seconds}} segundos para deshacer",
      importProgress: "Importando: {{processed}}/{{total}}",
    },
    pages: {
      error: {
        404: "La página que buscás no existe.",
        info: 'Puede que te hayas olvidado de agregar el componente de "{{action}}" al resource "{{resource}}".',
        backHome: "Volver al inicio",
      },
      login: {
        title: "Iniciá sesión en tu cuenta",
        signin: "Iniciar sesión",
        signup: "Registrarse",
        divider: "o",
        fields: {
          email: "Email",
          password: "Contraseña",
        },
        errors: {
          requiredEmail: "El email es obligatorio",
          validEmail: "Email inválido",
          requiredPassword: "La contraseña es obligatoria",
        },
        buttons: {
          forgotPassword: "¿Olvidaste tu contraseña?",
          rememberMe: "Recordarme",
          noAccount: "¿No tenés cuenta?",
          haveAccount: "¿Ya tenés cuenta?",
        },
      },
      forgotPassword: {
        title: "¿Olvidaste tu contraseña?",
        signin: "Iniciar sesión",
        fields: {
          email: "Email",
        },
        errors: {
          requiredEmail: "El email es obligatorio",
          validEmail: "Email inválido",
        },
        buttons: {
          submit: "Enviar instrucciones",
          haveAccount: "¿Ya tenés cuenta? ",
        },
      },
      updatePassword: {
        title: "Elegí tu nueva contraseña",
        fields: {
          password: "Nueva contraseña",
          confirmPassword: "Confirmar nueva contraseña",
        },
        errors: {
          requiredPassword: "La contraseña es obligatoria",
          requiredConfirmPassword: "Tenés que confirmar la contraseña",
          confirmPasswordNotMatch: "Las contraseñas no coinciden",
          // El checklist en vivo (utils/password.ts) ya muestra qué falta
          // mientras se escribe — este mensaje es el que aparece si de
          // todas formas se intenta enviar sin cumplir todo.
          passwordComplexity: "La contraseña no cumple con los requisitos de complejidad",
        },
        buttons: {
          submit: "Actualizar",
        },
      },
    },
    documentTitle: {
      default: APP_NAME,
      suffix: ` | ${APP_NAME}`,
    },
    // Nombre singular de cada resource — lo usan los mensajes de
    // notificación (`{{resource}} creado con éxito`, etc.) vía la clave
    // dinámica `${identifier}.${identifier}`; sin esto caen al fallback de
    // `pluralize.singular()` (inglés) en medio de una frase en español. No
    // hace falta para los resources donde ese fallback da bien de casualidad
    // (edificios, bloques, bancos, rubros) — pero no asumirlo en uno nuevo.
    users: {
      users: "usuario",
    },
    roles: {
      roles: "rol",
    },
    comodidades: {
      comodidades: "comodidad",
    },
    unidades: {
      unidades: "unidad",
    },
    proveedores: {
      proveedores: "proveedor",
    },
    "contratos-alquiler": {
      "contratos-alquiler": "contrato de alquiler",
    },
    "tipos-documento": {
      "tipos-documento": "tipo de documento",
    },
    "tipos-relacion": {
      "tipos-relacion": "tipo de relación",
    },
    ciudades: {
      ciudades: "ciudad",
    },
  },
};

// Título de cada pantalla de un resource (Edit/Create/Show/Clone): Refine
// pide una clave por resource (`${identifier}.titles.edit`, etc.), que no
// tiene sentido traducir una por una para cada resource nuevo. El fallback
// en inglés que llega siempre tiene la forma "Edit {label}" con el label ya
// en español (sale de `resource.meta.label`) — alcanza con traducir el verbo
// del principio, reusando el mismo texto que ya usan los botones.
const TITLE_ACTION_KEY: Record<string, string> = {
  Create: "buttons.create",
  Edit: "buttons.edit",
  Show: "buttons.show",
  Clone: "buttons.clone",
};

const translateResourceTitle = (fallback: string): string =>
  fallback.replace(/^(Create|Edit|Show|Clone)\b/, (word) => i18n.t(TITLE_ACTION_KEY[word]) as string);

i18n.use(initReactI18next).init({
  resources: { es },
  lng: "es",
  fallbackLng: "es",
  interpolation: { escapeValue: false },
});

export const i18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => {
    // La firma real de `translate` que usan @refinedev/core y
    // @refinedev/antd es `(key, defaultMessageOrOptions, defaultMessage?)`:
    // a veces pasan el default como segundo argumento (sin `options`) y a
    // veces como tercero (con `options` en el medio) — hay que soportar las
    // dos formas para que ningún string se quede sin fallback en inglés.
    const [i18nOptions, fallback] =
      typeof options === "string" ? [undefined, options] : [options, defaultMessage];

    if (/\.titles\.(create|edit|show|clone)$/.test(key) && !i18n.exists(key) && typeof fallback === "string") {
      return translateResourceTitle(fallback);
    }

    return i18n.t(key, { ...i18nOptions, defaultValue: fallback ?? key }) as string;
  },
  changeLocale: (lang, options) => i18n.changeLanguage(lang, options),
  getLocale: () => i18n.language,
};

export default i18n;
