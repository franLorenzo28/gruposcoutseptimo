import { useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  Bell,
  Eye,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { PageGridBackground } from "@/components/PageGridBackground";
import ConfiguracionPerfil from "@/components/configuracion/ConfiguracionPerfil";
import ConfiguracionPrivacidad from "@/components/configuracion/ConfiguracionPrivacidad";
import ConfiguracionNotificaciones from "@/components/configuracion/ConfiguracionNotificaciones";
import ConfiguracionSeguridad from "@/components/configuracion/ConfiguracionSeguridad";

type ConfigTab = "perfil" | "privacidad" | "notificaciones" | "seguridad";
type ConfigGroup = "Cuenta" | "Preferencias";

const CONFIG_TABS: Array<{
  id: ConfigTab;
  group: ConfigGroup;
  label: string;
  description: string;
  icon: ElementType;
}> = [
  {
    id: "perfil",
    group: "Cuenta",
    label: "Perfil",
    description: "Edita tu información personal",
    icon: User,
  },
  {
    id: "privacidad",
    group: "Cuenta",
    label: "Privacidad",
    description: "Controla quién ve tu actividad",
    icon: Eye,
  },
  {
    id: "notificaciones",
    group: "Preferencias",
    label: "Notificaciones",
    description: "Canales y avisos",
    icon: Bell,
  },
  {
    id: "seguridad",
    group: "Preferencias",
    label: "Seguridad",
    description: "Contraseña y protección",
    icon: Shield,
  },
];

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("perfil");
  const navigate = useNavigate();
  const activeTabConfig = CONFIG_TABS.find((tab) => tab.id === activeTab) || CONFIG_TABS[0];
  const groups: ConfigGroup[] = ["Cuenta", "Preferencias"];

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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Configuración</h1>
            <p className="text-sm text-muted-foreground">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
          {CONFIG_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-foreground/40 bg-foreground text-background"
                    : "border-border/70 bg-card/70 text-foreground hover:bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm font-medium">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm">
              {groups.map((group) => (
                <div key={group} className="mb-4 last:mb-0">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {CONFIG_TABS.filter((tab) => tab.group === group).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isActive
                              ? "bg-foreground text-background"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm">
            <div className="border-b border-border/60 px-5 py-4 sm:px-6">
              <h2 className="text-xl font-semibold">{activeTabConfig.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{activeTabConfig.description}</p>
            </div>
            <div className="px-4 py-5 sm:px-6">
                {renderContent()}
            </div>
          </section>
        </div>
      </div>
    </PageGridBackground>
  );
}
