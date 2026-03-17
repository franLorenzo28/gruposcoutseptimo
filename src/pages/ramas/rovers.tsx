import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Rovers = () => {
  return (
    <RamaLanding
      title="Rovers"
      lema="Servir"
      ageRange="18 a 21"
      intro="Una etapa de madurez y eleccion vocacional donde el servicio se transforma en proyecto de vida."
      image={communityImage}
      imageAlt="Rama Rovers del Grupo Scout Septimo"
      accentClass="bg-[#DD0303]"
      paragraphs={[
        "La Rama Rover impulsa experiencias de alto compromiso personal y comunitario. Cada rover define metas, recorridos y desafios.",
        "El foco esta en actuar con sentido: servir, construir redes y crecer como persona adulta con valores scout.",
      ]}
      bullets={[
        "Proyectos de impacto social sostenido.",
        "Experiencias de viaje, exploracion y aprendizaje autonomo.",
        "Plan personal de progresion para el cierre del ciclo juvenil.",
      ]}
    />
  );
};

export default Rovers;

