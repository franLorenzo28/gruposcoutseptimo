import { Outlet } from "react-router-dom";
import NavegacionPrincipal from "@/components/layout/NavegacionPrincipal";
import PieDePagina from "@/components/layout/PieDePagina";
import { NewsPopup } from "@/components/layout/NewsPopup";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import BotonVolverGlobal from "@/components/layout/BotonVolverGlobal";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";
import FondoAnimado from "@/components/layout/FondoAnimado";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import { PageGridBackground } from "@/components/PageGridBackground";

export function PublicSiteLayout() {
  return (
    <>
      <FondoAnimado />
      <NavegacionPrincipal />
      <NewsPopup />
      <ScrollAlInicio />
      <SaltarAlContenido />
      <BotonVolverGlobal />
      <NovedadesRecientes />
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
