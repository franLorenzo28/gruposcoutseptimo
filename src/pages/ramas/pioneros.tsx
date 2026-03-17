import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Pioneros = () => {
  return (
    <RamaLanding
      title="Pioneros"
      lema="Servir"
      ageRange="15 a 17"
      intro="Etapa de accion concreta: proyectos comunitarios, autonomia y liderazgo con impacto real."
      image={communityImage}
      imageAlt="Rama Pioneros del Grupo Scout Septimo"
      accentClass="bg-[#134686]"
      paragraphs={[
        "Pioneros es una etapa de consolidacion personal. Los y las jovenes disenan proyectos, toman decisiones y sostienen objetivos colectivos.",
        "El servicio comunitario se vuelve central: no solo participan, tambien lideran iniciativas para mejorar su entorno.",
      ]}
      bullets={[
        "Proyectos de servicio con planificacion y evaluacion.",
        "Experiencias de liderazgo en contextos reales.",
        "Construccion de autonomia con acompanamiento adulto.",
      ]}
    />
  );
};

export default Pioneros;

