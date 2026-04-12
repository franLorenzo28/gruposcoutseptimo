import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Lock,
  Bell,
  Eye,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageGridBackground } from "@/components/PageGridBackground";
import ConfiguracionPerfil from "@/components/configuracion/ConfiguracionPerfil";
import ConfiguracionPrivacidad from "@/components/configuracion/ConfiguracionPrivacidad";
import ConfiguracionNotificaciones from "@/components/configuracion/ConfiguracionNotificaciones";
import ConfiguracionSeguridad from "@/components/configuracion/ConfiguracionSeguridad";

type ConfigTab = "perfil" | "privacidad" | "notificaciones" | "seguridad";

const CONFIG_TABS: Array<{
  id: ConfigTab;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: "perfil",
    label: "Perfil",
    description: "Edita tu información personal y datos scouts",
    icon: User,
  },
  {
    id: "privacidad",
    label: "Privacidad",
    description: "Controla quién puede ver tu perfil y actividad",
    icon: Eye,
  },
  {
    id: "notificaciones",
    label: "Notificaciones",
    description: "Gestiona tus preferencias de notificaciones",
    icon: Bell,
  },
  {
    id: "seguridad",
    label: "Seguridad",
    description: "Cambia tu contraseña y opciones de seguridad",
    icon: Shield,
  },
];

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("perfil");
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case "perfil":
        return <ConfiguracionPerfil />;
      case "privacidad":
        return <ConfiguracionPrivacidad />;
      case "notificaciones":
        return <ConfiguracionNotificaciones />;
      case "seguridad":
        return <ConfiguracionSeguridad />;
      default:
        return <ConfiguracionPerfil />;
    }
  };

  return (
    <PageGridBackground>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/perfil")}
              className="shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black">Configuración</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona tu cuenta, privacidad y preferencias con guardado persistente
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar con opciones */}
          <Reveal>
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm">
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Secciones
                </p>
                <div className="space-y-2">
                {CONFIG_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full rounded-xl px-4 py-3 text-left transition-all flex items-center gap-3 border ${
                        isActive
                          ? "border-primary/40 bg-primary text-primary-foreground shadow-md"
                          : "border-transparent bg-muted/40 text-foreground hover:border-border/70 hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{tab.label}</p>
                        <p className={`text-xs ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Content area */}
          <Reveal>
            <Card className="border-border/70 shadow-lg">
              <CardHeader>
                <CardTitle>
                  {CONFIG_TABS.find((t) => t.id === activeTab)?.label}
                </CardTitle>
                <CardDescription>
                  {CONFIG_TABS.find((t) => t.id === activeTab)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </PageGridBackground>
  );
}
