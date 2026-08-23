import { Refine, GitHubBanner, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  useNotificationProvider,
  ThemedLayout,
  ThemedSider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { App as AntdApp } from "antd";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./providers/data";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { Header } from "./components/header";
import { AppIcon } from "./components/app-icon";
import { AppWordmark } from "./components/app-wordmark";
import { AppTitle } from "./components/app-title";
import { Login } from "./pages/login";
import { ForgotPassword } from "./pages/forgotPassword";
import { UpdatePassword } from "./pages/updatePassword";
import { authProvider } from "./providers/auth";
import { i18nProvider } from "./providers/i18n";
import { RoleHome } from "./pages/role-home";
import { RoleRoute } from "./components/role-route";
import { RoleBasedIndex } from "./components/role-based-index";
import { ROLE_PRIORITY } from "./providers/roles";
import { UserList, UserCreate, UserEdit } from "./pages/users";
import { RoleList } from "./pages/roles";

function App() {
  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                authProvider={authProvider}
                i18nProvider={i18nProvider}
                resources={[
                  {
                    name: "users",
                    list: "/administrador/usuarios",
                    create: "/administrador/usuarios/create",
                    edit: "/administrador/usuarios/edit/:id",
                    meta: {
                      label: "Usuarios",
                    },
                  },
                  {
                    name: "roles",
                    list: "/administrador/roles",
                    meta: {
                      label: "Roles y permisos",
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "jMr9IO-7L6vwi-jkJRSg",
                  // Nombre de la app en el menú lateral y en las pantallas
                  // de login/forgot-password (que usan este mismo default
                  // cuando no se les pasa un `title` propio) — ver
                  // ARQUITECTURA.md, "Branding: Inmova en vez del logo de Refine".
                  title: { text: <AppWordmark />, icon: <AppIcon /> },
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout
                          Header={Header}
                          Sider={(props) => (
                            <ThemedSider {...props} fixed Title={AppTitle} />
                          )}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<RoleBasedIndex />} />
                    {ROLE_PRIORITY.map((role) => (
                      <Route
                        key={role}
                        path={`/${role}/home`}
                        element={
                          <RoleRoute role={role}>
                            <RoleHome role={role} />
                          </RoleRoute>
                        }
                      />
                    ))}
                    <Route path="/administrador/usuarios">
                      <Route
                        index
                        element={
                          <RoleRoute role="administrador">
                            <UserList />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="create"
                        element={
                          <RoleRoute role="administrador">
                            <UserCreate />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="edit/:id"
                        element={
                          <RoleRoute role="administrador">
                            <UserEdit />
                          </RoleRoute>
                        }
                      />
                    </Route>
                    <Route
                      path="/administrador/roles"
                      element={
                        <RoleRoute role="administrador">
                          <RoleList />
                        </RoleRoute>
                      }
                    />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <RoleBasedIndex />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/update-password"
                      element={<UpdatePassword />}
                    />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
