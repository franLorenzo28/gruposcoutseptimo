import { Outlet } from "react-router-dom";
import ScrollAlInicio from "@/components/layout/ScrollAlInicio";
import TransicionRuta from "@/components/layout/TransicionRuta";
import SaltarAlContenido from "@/components/layout/SaltarAlContenido";
import { AdminPlatformNav } from "@/app/components/AdminPlatformNav";

export function AdminPlatformLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsla(var(--background)/1)_0%,hsla(var(--muted)/0.18)_100%)]">
      <ScrollAlInicio />
      <SaltarAlContenido />
      <AdminPlatformNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <TransicionRuta>
          <Outlet />
        </TransicionRuta>
      </main>
    </div>
  );
}
