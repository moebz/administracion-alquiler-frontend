import { AuthPage } from "@refinedev/antd";
import { AppTitle } from "../../components/app-title";

export const Login = () => {
  return (
    <AuthPage
      type="login"
      registerLink={false}
      rememberMe={false}
      title={<AppTitle />}
    />
  );
};
