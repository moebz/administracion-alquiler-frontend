import { Refine, Authenticated } from "@refinedev/core";
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
import { EdificioList, EdificioCreate, EdificioEdit } from "./pages/edificios";
import { BloqueList, BloqueCreate, BloqueEdit } from "./pages/bloques";
import { UnidadList, UnidadCreate, UnidadEdit } from "./pages/unidades";
import { BancoList, BancoCreate, BancoEdit } from "./pages/bancos";
import { ComodidadList, ComodidadCreate, ComodidadEdit } from "./pages/comodidades";

function App() {
  return (
    <BrowserRouter>
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
                  {
                    name: "edificios",
                    list: "/administrador/edificios",
                    create: "/administrador/edificios/create",
                    edit: "/administrador/edificios/edit/:id",
                    meta: {
                      label: "Edificios",
                    },
                  },
                  {
                    name: "comodidades",
                    list: "/administrador/comodidades",
                    create: "/administrador/comodidades/create",
                    edit: "/administrador/comodidades/edit/:id",
                    meta: {
                      label: "Comodidades",
                    },
                  },
                  {
                    name: "bloques",
                    list: "/administrador/bloques",
                    create: "/administrador/bloques/create",
                    edit: "/administrador/bloques/edit/:id",
                    meta: {
                      label: "Bloques",
                    },
                  },
                  {
                    name: "unidades",
                    list: "/administrador/unidades",
                    create: "/administrador/unidades/create",
                    edit: "/administrador/unidades/edit/:id",
                    meta: {
                      label: "Unidades",
                    },
                  },
                  {
                    name: "bancos",
                    list: "/administrador/bancos",
                    create: "/administrador/bancos/create",
                    edit: "/administrador/bancos/edit/:id",
                    meta: {
                      label: "Bancos",
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "jMr9IO-7L6vwi-jkJRSg",
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
                    <Route path="/administrador/edificios">
                      <Route
                        index
                        element={
                          <RoleRoute role="administrador">
                            <EdificioList />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="create"
                        element={
                          <RoleRoute role="administrador">
                            <EdificioCreate />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="edit/:id"
                        element={
                          <RoleRoute role="administrador">
                            <EdificioEdit />
                          </RoleRoute>
                        }
                      />
                    </Route>
                    <Route path="/administrador/comodidades">
                      <Route
                        index
                        element={
                          <RoleRoute role="administrador">
                            <ComodidadList />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="create"
                        element={
                          <RoleRoute role="administrador">
                            <ComodidadCreate />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="edit/:id"
                        element={
                          <RoleRoute role="administrador">
                            <ComodidadEdit />
                          </RoleRoute>
                        }
                      />
                    </Route>
                    <Route path="/administrador/bloques">
                      <Route
                        index
                        element={
                          <RoleRoute role="administrador">
                            <BloqueList />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="create"
                        element={
                          <RoleRoute role="administrador">
                            <BloqueCreate />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="edit/:id"
                        element={
                          <RoleRoute role="administrador">
                            <BloqueEdit />
                          </RoleRoute>
                        }
                      />
                    </Route>
                    <Route path="/administrador/unidades">
                      <Route
                        index
                        element={
                          <RoleRoute role="administrador">
                            <UnidadList />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="create"
                        element={
                          <RoleRoute role="administrador">
                            <UnidadCreate />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="edit/:id"
                        element={
                          <RoleRoute role="administrador">
                            <UnidadEdit />
                          </RoleRoute>
                        }
                      />
                    </Route>
                    <Route path="/administrador/bancos">
                      <Route
                        index
                        element={
                          <RoleRoute role="administrador">
                            <BancoList />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="create"
                        element={
                          <RoleRoute role="administrador">
                            <BancoCreate />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="edit/:id"
                        element={
                          <RoleRoute role="administrador">
                            <BancoEdit />
                          </RoleRoute>
                        }
                      />
                    </Route>
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
