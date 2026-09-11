import { Suspense } from "react";
import PageLoader from "@/components/ui/PageLoader";
import { Outlet } from "react-router-dom";
import NavegacionPrincipal from "@/components/layout/NavegacionPrincipal";
import PieDePagina from "@/components/layout/PieDePagina";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import BotonVolverGlobal from "@/components/layout/BotonVolverGlobal";
import FondoAnimado from "@/components/layout/FondoAnimado";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import { PageGridBackground } from "@/components/PageGridBackground";

export function PublicSiteLayout() {
  return (
    <>
      <FondoAnimado />
      <NavegacionPrincipal />
      <ScrollAlInicio />
      <SaltarAlContenido />
      <BotonVolverGlobal />
      <PageGridBackground className="public-app-shell">
        <main id="main-content" tabIndex={-1} className="min-h-screen">
          <TransicionRuta>
            <Suspense fallback={<PageLoader compact message="Cargando sección…" />}><Outlet /></Suspense>
          </TransicionRuta>
        </main>
      </PageGridBackground>
      <PieDePagina />
    </>
  );
}
