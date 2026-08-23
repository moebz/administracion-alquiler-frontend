import { CheckCircleFilled, CloseCircleOutlined } from "@ant-design/icons";
import { useTranslate, useUpdatePassword } from "@refinedev/core";
import { Button, Card, Col, Form, Input, Layout, Row, Space, Typography } from "antd";
import { AppTitle } from "../../components/app-title";
import { PASSWORD_REQUIREMENTS, passwordMeetsComplexity } from "../../utils/password";

export const UpdatePassword = () => {
  const [form] = Form.useForm();
  const translate = useTranslate();
  const { mutate: updatePassword, isPending } = useUpdatePassword();
  const password = Form.useWatch("password", form) ?? "";

  return (
    <Layout style={{ background: "transparent" }}>
      <Row justify="center" align="middle" style={{ padding: "16px 0", minHeight: "100dvh" }}>
        <Col xs={22} sm={20} md={16} lg={8}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <AppTitle />
          </div>
          <Card>
            <Typography.Title level={4} style={{ marginTop: 0 }}>
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
                rules={[
                  {
                    required: true,
                    message: translate(
                      "pages.updatePassword.errors.requiredPassword",
                      "La contraseña es obligatoria",
                    ),
                  },
                  {
                    validator: (_, value: string | undefined) =>
                      !value || passwordMeetsComplexity(value)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              translate(
                                "pages.updatePassword.errors.passwordComplexity",
                                "La contraseña no cumple con los requisitos de complejidad",
                              ),
                            ),
                          ),
                  },
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>
              <Space direction="vertical" size={2} style={{ display: "flex", marginBottom: 24 }}>
                {PASSWORD_REQUIREMENTS.map((requirement) => {
                  const met = requirement.test(password);
                  return (
                    <Typography.Text key={requirement.key} type={met ? "success" : "secondary"}>
                      {met ? <CheckCircleFilled /> : <CloseCircleOutlined />} {requirement.label}
                    </Typography.Text>
                  );
                })}
              </Space>
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
