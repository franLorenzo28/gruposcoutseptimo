import { Link, Navigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/providers/AppProviders";
import { useMemberAuth } from "@/context/MemberAuthContext";

export default function InternalLoginEntry() {
  const { user, isUserLoading } = useSupabaseUser();
  const { isAuthenticated, isCheckingAuth } = useMemberAuth();
  if (isUserLoading || isCheckingAuth) return <div className="grid min-h-screen place-items-center">Validando acceso...</div>;
  if (!user) return <Navigate to="/?auth=login&next=%2Finterno%2Fdashboard" replace />;
  if (isAuthenticated) return <Navigate to="/interno/dashboard" replace />;
  return <div className="grid min-h-screen place-items-center px-4">
    <div className="max-w-md rounded-[28px] border bg-card p-8 text-center shadow-xl">
      <ShieldX className="mx-auto h-12 w-12 text-amber-600" />
      <h1 className="mt-5 font-serif text-2xl">Acceso interno no habilitado</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Tu cuenta pública está disponible. Para ingresar a la plataforma interna, el administrador debe agregarte y asignarte una unidad o rol.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2"><Button asChild><Link to="/mi-perfil">Mi perfil</Link></Button><Button asChild variant="outline"><Link to="/">Ir al inicio</Link></Button></div>
    </div>
  </div>;
}
