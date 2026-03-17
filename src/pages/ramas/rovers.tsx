import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Rovers = () => {
  return (
    <RamaLanding
      title="Rovers"
      lema="Servir"
      ageRange="18 a 21"
      intro="Una etapa de madurez y elección vocacional donde el servicio se transforma en proyecto de vida."
      image={communityImage}
      imageAlt="Rama Rovers del Grupo Scout Séptimo"
      accentClass="bg-[#DD0303]"
      paragraphs={[
        "La Rama Rover impulsa experiencias de alto compromiso personal y comunitario. Cada rover define metas, recorridos y desafíos.",
        "El foco está en actuar con sentido: servir, construir redes y crecer como persona adulta con valores scout.",
      ]}
      bullets={[
        "Proyectos de impacto social sostenido.",
        "Experiencias de viaje, exploración y aprendizaje autónomo.",
        "Plan personal de progresión para el cierre del ciclo juvenil.",
      ]}
    />
  );
};

export default Rovers;

