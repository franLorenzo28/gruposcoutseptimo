
import HeroInicio from "@/components/sections/HeroInicio";
import NovedadesRecientes from "@/components/sections/NovedadesRecientes";
import SobreElGrupo from "@/components/sections/SobreElGrupo";

const Index = () => {
  return (
    <div className="page-animate min-h-screen">
      <HeroInicio />
      <SobreElGrupo />
      <NovedadesRecientes />
    </div>
  );
};

export default Index;
