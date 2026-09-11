import { Suspense } from "react";
import PageLoader from "@/components/ui/PageLoader";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import FondoAnimado from "@/components/layout/FondoAnimado";
import { PageGridBackground } from "@/components/PageGridBackground";
import { InternalPlatformNav } from "@/app/components/InternalPlatformNav";

export function InternalPlatformLayout() {
  const location = useLocation();
  const isAuthPage = /^\/interno\/(?:auth(?:\/callback)?|login|restablecer-password)\/?$/i.test(location.pathname);

  if (isAuthPage) {
    return (
      <>
        <FondoAnimado />
        <ScrollAlInicio />
        <SaltarAlContenido />
        <main id="main-content" tabIndex={-1} className="min-h-screen">
          <TransicionRuta>
            <Suspense fallback={<PageLoader compact message="Cargando sección…" />}><Outlet /></Suspense>
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
      <PageGridBackground className="internal-app-shell">
        <main id="main-content" tabIndex={-1} className="min-h-screen">
          <TransicionRuta>
            <Suspense fallback={<PageLoader compact message="Cargando sección…" />}><Outlet /></Suspense>
          </TransicionRuta>
        </main>
      </PageGridBackground>
      <footer className="border-t border-border px-4 py-6"><nav aria-label="Ayuda de la plataforma" className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"><Link className="underline underline-offset-4" to="/contacto">Ayuda y contacto</Link><Link className="underline underline-offset-4" to="/interno/configuracion">Mi cuenta y privacidad</Link><Link className="underline underline-offset-4" to="/">Sitio público del Séptimo</Link></nav></footer>
    </>
  );
}
