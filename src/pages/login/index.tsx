import { AuthPage } from "@refinedev/antd";
import { AppTitle } from "../../components/app-title";

export const Login = () => {
  return (
    <AuthPage
      type="login"
      // Sin link de "Sign up": el alta de usuarios es solo del admin, no
      // existe una ruta pública de registro (ver ARQUITECTURA.md).
      registerLink={false}
      // title propio en vez del default de AuthPage (ThemedTitle sin
      // wrapperStyles) para achicar el gap entre ícono y wordmark — ver
      // components/app-title.
      title={<AppTitle />}
      formProps={{
        initialValues: { email: "demo@refine.dev", password: "demodemo" },
      }}
    />
  );
};
