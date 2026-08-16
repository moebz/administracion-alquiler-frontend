import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { I18nProvider } from "@refinedev/core";

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
      createSuccess: "{{resource}} creado con éxito",
      createError: "Hubo un error al crear {{resource}} (código {{statusCode}})",
      deleteSuccess: "{{resource}} eliminado con éxito",
      deleteError: "Error al eliminar {{resource}} (código {{statusCode}})",
      editSuccess: "{{resource}} editado con éxito",
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
        },
        buttons: {
          submit: "Actualizar",
        },
      },
    },
    documentTitle: {
      default: "Inmova",
      suffix: " | Inmova",
    },
    // Nombre singular de cada resource — lo usan los mensajes de
    // notificación (`{{resource}} creado con éxito`, etc.) vía la clave
    // dinámica `${identifier}.${identifier}`; sin esto caerían al fallback
    // en inglés ("user") en medio de una frase en español.
    users: {
      users: "usuario",
    },
  },
};

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

    return i18n.t(key, { ...i18nOptions, defaultValue: fallback ?? key }) as string;
  },
  changeLocale: (lang, options) => i18n.changeLanguage(lang, options),
  getLocale: () => i18n.language,
};

export default i18n;
