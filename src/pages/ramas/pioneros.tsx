import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Pioneros = () => {
  return (
    <RamaLanding
      title="Pioneros"
      lema="Servir"
      ageRange="15 a 17"
      intro="Etapa de acción concreta: proyectos comunitarios, autonomía y liderazgo con impacto real."
      image={communityImage}
      imageAlt="Rama Pioneros del Grupo Scout Séptimo"
      accentClass="bg-[#134686]"
      paragraphs={[
        "Pioneros es una etapa de consolidación personal. Los y las jóvenes diseñan proyectos, toman decisiones y sostienen objetivos colectivos.",
        "El servicio comunitario se vuelve central: no solo participan, también lideran iniciativas para mejorar su entorno.",
      ]}
      bullets={[
        "Proyectos de servicio con planificación y evaluación.",
        "Experiencias de liderazgo en contextos reales.",
        "Construcción de autonomía con acompañamiento adulto.",
      ]}
    />
  );
};

export default Pioneros;

