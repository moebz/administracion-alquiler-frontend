import { useTranslate, useUpdatePassword } from "@refinedev/core";
import { Button, Card, Col, Form, Input, Layout, Row, Typography } from "antd";

// Pantalla compartida por invitación de alta (admin) y recuperación
// self-service — mismo authProvider.updatePassword, mismo link de mail
// (/update-password?token=...&email=...). Ver ARQUITECTURA.md, "Alta de usuarios".
//
// No usa <AuthPage type="updatePassword"> (a diferencia de login/forgot-password):
// ese scaffold no deja agregar un `extra` bajo el campo de contraseña, y acá
// hace falta mostrar la regla de complejidad ANTES de que la persona escriba
// (no solo como error después de fallar) — ver App\Providers\AppServiceProvider
// del backend para la regla real.
export const UpdatePassword = () => {
  const [form] = Form.useForm();
  const translate = useTranslate();
  const { mutate: updatePassword, isPending } = useUpdatePassword();

  return (
    <Layout style={{ background: "transparent" }}>
      <Row justify="center" align="middle" style={{ padding: "16px 0", minHeight: "100dvh" }}>
        <Col xs={22} sm={20} md={16} lg={8}>
          <Card>
            <Typography.Title level={3} style={{ textAlign: "center", marginTop: 0 }}>
              {translate("pages.updatePassword.title", "Elegí tu nueva contraseña")}
            </Typography.Title>
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={(values) => updatePassword(values)}
            >
              <Form.Item
                name="password"
                label={translate("pages.updatePassword.fields.password", "Nueva contraseña")}
                extra={translate(
                  "pages.updatePassword.hints.password",
                  "Mínimo 8 caracteres, con mayúsculas, minúsculas, números y símbolos.",
                )}
                rules={[
                  {
                    required: true,
                    message: translate(
                      "pages.updatePassword.errors.requiredPassword",
                      "La contraseña es obligatoria",
                    ),
                  },
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label={translate(
                  "pages.updatePassword.fields.confirmPassword",
                  "Confirmar nueva contraseña",
                )}
                dependencies={["password"]}
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: translate(
                      "pages.updatePassword.errors.requiredConfirmPassword",
                      "Tenés que confirmar la contraseña",
                    ),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          translate(
                            "pages.updatePassword.errors.confirmPasswordNotMatch",
                            "Las contraseñas no coinciden",
                          ),
                        ),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
                  {translate("pages.updatePassword.buttons.submit", "Actualizar")}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
