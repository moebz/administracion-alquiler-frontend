import { AuthPage } from "@refinedev/antd";

// Pantalla compartida por invitación de alta (admin) y recuperación
// self-service — mismo authProvider.updatePassword, mismo link de mail
// (/update-password?token=...&email=...). Ver DECISIONES.md, "Alta de usuarios".
export const UpdatePassword = () => {
  return <AuthPage type="updatePassword" />;
};
