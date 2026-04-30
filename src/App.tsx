import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import NavegacionPrincipal from "@/components/layout/NavegacionPrincipal";
import PieDePagina from "@/components/layout/PieDePagina";
import { NewsPopup } from "@/components/layout/NewsPopup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/routes/AppRoutes";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import BotonVolverGlobal from "@/components/layout/BotonVolverGlobal";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";
import FondoAnimado from "@/components/layout/FondoAnimado";
import ErrorBoundary from "@/components/ErrorBoundary";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import { PageGridBackground } from "@/components/PageGridBackground";
import Seo from "@/components/Seo";

const App = () => (
  <ErrorBoundary>
    <AppProviders>
      <Toaster />
      <Sonner />
      <HelmetProvider>
        <BrowserRouter>
          <Seo />
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
                <AppRoutes />
              </TransicionRuta>
            </main>
          </PageGridBackground>
          <PieDePagina />
        </BrowserRouter>
      </HelmetProvider>
    </AppProviders>
  </ErrorBoundary>
);

export default App;
