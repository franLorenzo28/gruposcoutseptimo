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
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <Reveal>
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/perfil")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black">Configuración</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona tu cuenta, privacidad y preferencias
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[300px_1fr]">
          {/* Sidebar con opciones */}
          <Reveal>
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="space-y-2">
                {CONFIG_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted/40 hover:bg-muted/60 text-foreground"
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
    </div>
  );
}
