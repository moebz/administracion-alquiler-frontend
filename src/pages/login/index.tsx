import { AuthPage } from "@refinedev/antd";

export const Login = () => {
  return (
    <AuthPage
      type="login"
      // Sin link de "Sign up": el alta de usuarios es solo del admin, no
      // existe una ruta pública de registro (ver DECISIONES.md).
      registerLink={false}
      formProps={{
        initialValues: { email: "demo@refine.dev", password: "demodemo" },
      }}
    />
  );
};
