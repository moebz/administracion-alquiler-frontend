import { ThemedTitle } from "@refinedev/antd";

// Ícono + wordmark juntos, con el gap achicado respecto al default de
// ThemedTitle (antd <Space size="small"> = 8px). El SVG original
// (public/inmova-logo.svg) los dibuja casi pegados; sumado a que AppIcon
// trae de por sí un margen en blanco a la derecha del dibujo (el viewBox es
// más ancho que el contenido), el gap de 8px + ese margen hacía que el
// ícono se viera "separado" de la palabra. No pasamos icon/text: ThemedTitle
// los toma de options.title en <Refine> (ver App.tsx).
//
// Usado en el Sider (App.tsx, vía Title de ThemedSider), login,
// forgotPassword (título default de <AuthPage>) y updatePassword (antes
// armaba el mismo lockup a mano con <Space>) — un solo lugar para ajustar
// el espaciado en los cuatro.
//
// El div envolvente centra el lockup dentro del ancho disponible. En el
// Sider expandido hace falta: el contenedor de ThemedSider usa
// justifyContent:"flex-start" (no hay forma de pasarle otro valor desde
// afuera), así que el logo quedaba pegado a la izquierda con el resto del
// sidebar vacío a la derecha — centramos nosotros ocupando el 100% del
// ancho disponible. En login/forgotPassword/updatePassword no cambia nada
// (esas pantallas ya centran su título por su cuenta).
export const AppTitle = ({ collapsed }: { collapsed?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
    <ThemedTitle collapsed={!!collapsed} wrapperStyles={{ gap: 4 }} />
  </div>
);
