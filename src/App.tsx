import {
  UserOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  StarOutlined,
  BlockOutlined,
  HomeOutlined,
  FileTextOutlined,
  ShopOutlined,
  TagsOutlined,
  DatabaseOutlined,
  BankOutlined,
  IdcardOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Refine, Authenticated, CanAccess } from "@refinedev/core";
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
import { accessControlProvider } from "./providers/access-control";
import { i18nProvider } from "./providers/i18n";
import { RoleHome } from "./pages/role-home";
import { SectionRoute } from "./components/section-route";
import { RoleBasedIndex } from "./components/role-based-index";
import { SECTIONS } from "./providers/sections";
import { UserCreate, UserEdit } from "./pages/users";
import { PersonaList, PersonaCreate, PersonaEdit } from "./pages/personas";
import { RoleList, RoleCreate, RoleEdit, RolePermissions } from "./pages/roles";
import { EdificioList, EdificioCreate, EdificioEdit } from "./pages/edificios";
import { BloqueList, BloqueCreate, BloqueEdit } from "./pages/bloques";
import { UnidadList, UnidadCreate, UnidadEdit } from "./pages/unidades";
import {
  ContratoAlquilerList,
  ContratoAlquilerCreate,
  ContratoAlquilerEdit,
} from "./pages/contratos-alquiler";
import { BancoList, BancoCreate, BancoEdit } from "./pages/bancos";
import { ComodidadList, ComodidadCreate, ComodidadEdit } from "./pages/comodidades";
import { ProveedorList, ProveedorCreate, ProveedorEdit } from "./pages/proveedores";
import { RubroList, RubroCreate, RubroEdit } from "./pages/rubros";
import {
  TipoDocumentoList,
  TipoDocumentoCreate,
  TipoDocumentoEdit,
} from "./pages/tipos-documento";
import { TipoRelacionList, TipoRelacionCreate, TipoRelacionEdit } from "./pages/tipos-relacion";
import { CiudadList, CiudadCreate, CiudadEdit } from "./pages/ciudades";

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
                accessControlProvider={accessControlProvider}
                i18nProvider={i18nProvider}
                resources={[
                  {
                    name: "personas",
                    list: "/administrador/personas",
                    create: "/administrador/personas/create",
                    edit: "/administrador/personas/edit/:id",
                    meta: {
                      label: "Personas",
                      icon: <UserOutlined />,
                    },
                  },
                  {
                    name: "personas-todos",
                    list: "/administrador/personas",
                    meta: {
                      label: "Personas",
                      icon: <UserOutlined />,
                      parent: "personas",
                    },
                  },
                  {
                    name: "roles",
                    list: "/administrador/roles",
                    create: "/administrador/roles/create",
                    edit: "/administrador/roles/edit/:id",
                    meta: {
                      label: "Roles",
                      icon: <SafetyCertificateOutlined />,
                      parent: "personas",
                    },
                  },
                  {
                    // Sin endpoint propio: la página es la matriz de permisos por rol.
                    name: "permisos",
                    list: "/administrador/roles/permisos",
                    meta: {
                      label: "Permisos por rol",
                      icon: <SafetyCertificateOutlined />,
                      parent: "personas",
                    },
                  },
                  {
                    // Sin `list`: el listado de usuarios se fusionó con el
                    // de Personas. `list` apunta ahí para que el botón
                    // "volver" de Create/Edit y el redirect post-guardado
                    // caigan en /administrador/personas, y `meta.hide` para
                    // que la cuenta no aparezca sola en el menú.
                    name: "users",
                    list: "/administrador/personas",
                    create: "/administrador/usuarios/create",
                    edit: "/administrador/usuarios/edit/:id",
                    meta: {
                      label: "Usuarios",
                      icon: <UserOutlined />,
                      hide: true,
                      parent: "personas",
                    },
                  },
                  {
                    name: "edificios",
                    list: "/administrador/edificios",
                    create: "/administrador/edificios/create",
                    edit: "/administrador/edificios/edit/:id",
                    meta: {
                      label: "Edificios",
                      icon: <ApartmentOutlined />,
                    },
                  },
                  {
                    name: "edificios-todos",
                    list: "/administrador/edificios",
                    meta: {
                      label: "Edificios",
                      icon: <ApartmentOutlined />,
                      parent: "edificios",
                    },
                  },
                  {
                    name: "comodidades",
                    list: "/administrador/comodidades",
                    create: "/administrador/comodidades/create",
                    edit: "/administrador/comodidades/edit/:id",
                    meta: {
                      label: "Comodidades",
                      icon: <StarOutlined />,
                      parent: "edificios",
                    },
                  },
                  {
                    // Sin entrada propia en el menú: solo se accede
                    // navegando Edificios -> "Ver bloques" (pages/edificios/list.tsx).
                    // meta.hide en el padre también saca del menú a sus
                    // hijos (unidades, que lo tiene como parent) — ver
                    // useMenu en @refinedev/core. Las rutas siguen activas.
                    name: "bloques",
                    list: "/administrador/bloques",
                    create: "/administrador/bloques/create",
                    edit: "/administrador/bloques/edit/:id",
                    meta: {
                      label: "Bloques",
                      icon: <BlockOutlined />,
                      parent: "edificios",
                      hide: true,
                    },
                  },
                  {
                    // Sin entrada propia en el menú: solo se accede
                    // navegando Edificios/Bloques -> "Ver unidades".
                    name: "unidades",
                    list: "/administrador/unidades",
                    create: "/administrador/unidades/create",
                    edit: "/administrador/unidades/edit/:id",
                    meta: {
                      label: "Unidades",
                      icon: <HomeOutlined />,
                      parent: "bloques",
                      hide: true,
                    },
                  },
                  {
                    // A diferencia de bloques/unidades, este sí queda visible en
                    // el menú (bajo Edificios): tiene filtros propios (estado,
                    // vencimiento) útiles para consultarlo sin pasar por una unidad.
                    name: "contratos-alquiler",
                    list: "/administrador/contratos-alquiler",
                    create: "/administrador/contratos-alquiler/create",
                    edit: "/administrador/contratos-alquiler/edit/:id",
                    meta: {
                      label: "Contratos de alquiler",
                      icon: <FileTextOutlined />,
                      parent: "edificios",
                    },
                  },
                  {
                    name: "proveedores",
                    list: "/administrador/proveedores",
                    create: "/administrador/proveedores/create",
                    edit: "/administrador/proveedores/edit/:id",
                    meta: {
                      label: "Proveedores",
                      icon: <ShopOutlined />,
                    },
                  },
                  {
                    name: "proveedores-todos",
                    list: "/administrador/proveedores",
                    meta: {
                      label: "Proveedores",
                      icon: <ShopOutlined />,
                      parent: "proveedores",
                    },
                  },
                  {
                    name: "rubros",
                    list: "/administrador/rubros",
                    create: "/administrador/rubros/create",
                    edit: "/administrador/rubros/edit/:id",
                    meta: {
                      label: "Rubros",
                      icon: <TagsOutlined />,
                      parent: "proveedores",
                    },
                  },
                  {
                    name: "catalogos",
                    meta: {
                      label: "Catálogos",
                      icon: <DatabaseOutlined />,
                    },
                  },
                  {
                    name: "bancos",
                    list: "/administrador/bancos",
                    create: "/administrador/bancos/create",
                    edit: "/administrador/bancos/edit/:id",
                    meta: {
                      label: "Bancos",
                      icon: <BankOutlined />,
                      parent: "catalogos",
                    },
                  },
                  {
                    name: "tipos-documento",
                    list: "/administrador/tipos-documento",
                    create: "/administrador/tipos-documento/create",
                    edit: "/administrador/tipos-documento/edit/:id",
                    meta: {
                      label: "Tipos de documento",
                      icon: <IdcardOutlined />,
                      parent: "catalogos",
                    },
                  },
                  {
                    name: "tipos-relacion",
                    list: "/administrador/tipos-relacion",
                    create: "/administrador/tipos-relacion/create",
                    edit: "/administrador/tipos-relacion/edit/:id",
                    meta: {
                      label: "Tipos de relación",
                      icon: <ShareAltOutlined />,
                      parent: "catalogos",
                      // Oculto del menú: no está en uso todavía en el front.
                      hide: true,
                    },
                  },
                  {
                    name: "ciudades",
                    list: "/administrador/ciudades",
                    create: "/administrador/ciudades/create",
                    edit: "/administrador/ciudades/edit/:id",
                    meta: {
                      label: "Ciudades",
                      icon: <EnvironmentOutlined />,
                      parent: "catalogos",
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
                    {SECTIONS.map((section) => (
                      <Route
                        key={section}
                        path={`/${section}/home`}
                        element={
                          <SectionRoute section={section}>
                            <RoleHome section={section} />
                          </SectionRoute>
                        }
                      />
                    ))}
                    <Route
                      path="/administrador"
                      element={
                        <SectionRoute section="administrador">
                          <CanAccess fallback={<ErrorComponent />}>
                            <Outlet />
                          </CanAccess>
                        </SectionRoute>
                      }
                    >
                      <Route path="personas">
                        <Route index element={<PersonaList />} />
                        <Route path="create" element={<PersonaCreate />} />
                        <Route path="edit/:id" element={<PersonaEdit />} />
                      </Route>
                      <Route path="usuarios">
                        <Route path="create" element={<UserCreate />} />
                        <Route path="edit/:id" element={<UserEdit />} />
                      </Route>
                      <Route path="roles">
                        <Route index element={<RoleList />} />
                        <Route path="create" element={<RoleCreate />} />
                        <Route path="edit/:id" element={<RoleEdit />} />
                        <Route path="permisos" element={<RolePermissions />} />
                      </Route>
                      <Route path="edificios">
                        <Route index element={<EdificioList />} />
                        <Route path="create" element={<EdificioCreate />} />
                        <Route path="edit/:id" element={<EdificioEdit />} />
                      </Route>
                      <Route path="comodidades">
                        <Route index element={<ComodidadList />} />
                        <Route path="create" element={<ComodidadCreate />} />
                        <Route path="edit/:id" element={<ComodidadEdit />} />
                      </Route>
                      <Route path="bloques">
                        <Route index element={<BloqueList />} />
                        <Route path="create" element={<BloqueCreate />} />
                        <Route path="edit/:id" element={<BloqueEdit />} />
                      </Route>
                      <Route path="unidades">
                        <Route index element={<UnidadList />} />
                        <Route path="create" element={<UnidadCreate />} />
                        <Route path="edit/:id" element={<UnidadEdit />} />
                      </Route>
                      <Route path="contratos-alquiler">
                        <Route index element={<ContratoAlquilerList />} />
                        <Route path="create" element={<ContratoAlquilerCreate />} />
                        <Route path="edit/:id" element={<ContratoAlquilerEdit />} />
                      </Route>
                      <Route path="bancos">
                        <Route index element={<BancoList />} />
                        <Route path="create" element={<BancoCreate />} />
                        <Route path="edit/:id" element={<BancoEdit />} />
                      </Route>
                      <Route path="proveedores">
                        <Route index element={<ProveedorList />} />
                        <Route path="create" element={<ProveedorCreate />} />
                        <Route path="edit/:id" element={<ProveedorEdit />} />
                      </Route>
                      <Route path="rubros">
                        <Route index element={<RubroList />} />
                        <Route path="create" element={<RubroCreate />} />
                        <Route path="edit/:id" element={<RubroEdit />} />
                      </Route>
                      <Route path="tipos-documento">
                        <Route index element={<TipoDocumentoList />} />
                        <Route path="create" element={<TipoDocumentoCreate />} />
                        <Route path="edit/:id" element={<TipoDocumentoEdit />} />
                      </Route>
                      <Route path="tipos-relacion">
                        <Route index element={<TipoRelacionList />} />
                        <Route path="create" element={<TipoRelacionCreate />} />
                        <Route path="edit/:id" element={<TipoRelacionEdit />} />
                      </Route>
                      <Route path="ciudades">
                        <Route index element={<CiudadList />} />
                        <Route path="create" element={<CiudadCreate />} />
                        <Route path="edit/:id" element={<CiudadEdit />} />
                      </Route>
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
