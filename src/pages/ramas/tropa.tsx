import RamaLanding from "@/components/sections/RamaLanding";
import tropaImage from "@/assets/tropa-nueva.jpeg";

const Tropa = () => {
  return (
    <RamaLanding
      title="Tropa"
      lema="Siempre listos"
      ageRange="11 a 14"
      intro="Patrullas, campamentos y desafio constante para construir liderazgo real en equipo."
      image={tropaImage}
      imageAlt="Rama Tropa del Grupo Scout Septimo"
      accentClass="bg-[#344F1F]"
      paragraphs={[
        "La Tropa reune adolescentes que estan en plena etapa de descubrimiento e independencia. El sistema de patrullas les da identidad, responsabilidad y pertenencia.",
        "Cada proyecto fortalece autonomia, tecnica scout y capacidad de decision. La aventura se vive con proposito, no como actividad aislada.",
      ]}
      bullets={[
        "Campamentos y salidas periodicas durante el ano.",
        "Aprendizaje de tecnicas scout y vida al aire libre.",
        "Trabajo de liderazgo progresivo en patrullas.",
      ]}
    />
  );
};

export default Tropa;

