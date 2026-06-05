import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import FondoAnimado from "@/components/layout/FondoAnimado";
import PieDePagina from "@/components/layout/PieDePagina";
import { PageGridBackground } from "@/components/PageGridBackground";
import { InternalPlatformNav } from "@/app/components/InternalPlatformNav";

export function InternalPlatformLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/interno/auth" || location.pathname === "/interno/auth/callback";

  if (isAuthPage) {
    return (
      <>
        <FondoAnimado />
        <ScrollAlInicio />
        <SaltarAlContenido />
        <main id="main-content" tabIndex={-1} className="min-h-screen">
          <TransicionRuta>
            <Outlet />
          </TransicionRuta>
        </main>
      </>
    );
  }

  return (
    <>
      <FondoAnimado />
      <ScrollAlInicio />
      <SaltarAlContenido />
      <InternalPlatformNav />
      <PageGridBackground>
        <main id="main-content" tabIndex={-1} className="min-h-screen">
          <TransicionRuta>
            <Outlet />
          </TransicionRuta>
        </main>
      </PageGridBackground>
      <PieDePagina />
    </>
  );
}
