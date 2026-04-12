import RamaLanding from "@/components/sections/RamaLanding";
import { getOptimizedImageProps } from "@/lib/optimized-images";

const Tropa = () => {
  const tropaImages = getOptimizedImageProps("tropa");
  return (
    <RamaLanding
      title="Tropa"
      lema="Siempre listos"
      ageRange="11 a 14"
      intro="Patrullas, campamentos y desafío constante para construir liderazgo real en equipo."
      image={tropaImages}
      imageAlt="Unidad Tropa del Grupo Scout Séptimo"
      accentClass="bg-[#344F1F]"
      paragraphs={[
        "La Tropa reúne adolescentes que están en plena etapa de descubrimiento e independencia. El sistema de patrullas les da identidad, responsabilidad y pertenencia.",
        "Cada proyecto fortalece autonomía, técnica scout y capacidad de decisión. La aventura se vive con propósito, no como actividad aislada.",
      ]}
      bullets={[
        "Campamentos y salidas periódicas durante el año.",
        "Aprendizaje de técnicas scout y vida al aire libre.",
        "Trabajo de liderazgo progresivo en patrullas.",
      ]}
    />
  );
};

export default Tropa;

