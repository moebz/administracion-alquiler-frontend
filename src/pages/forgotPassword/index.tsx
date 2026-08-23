import { AuthPage } from "@refinedev/antd";
import { AppTitle } from "../../components/app-title";

export const ForgotPassword = () => {
  // title propio: ver comentario en pages/login/index.tsx.
  return <AuthPage type="forgotPassword" title={<AppTitle />} />;
};
