import { AuthPage } from "@refinedev/antd";
import { AppTitle } from "../../components/app-title";

export const ForgotPassword = () => {
  return <AuthPage type="forgotPassword" title={<AppTitle />} />;
};
