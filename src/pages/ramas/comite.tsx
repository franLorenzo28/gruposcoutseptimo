import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Comite = () => {
  return (
    <RamaLanding
      title="Comite de Padres"
      lema="Apoyar y construir comunidad"
      ageRange="Familias voluntarias"
      intro="Madres, padres y referentes que hacen posible la logistica y el sosten de la vida de grupo."
      image={communityImage}
      imageAlt="Comite de familias del Grupo Scout Septimo"
      accentClass="bg-zinc-600"
      paragraphs={[
        "El Comite de Padres acompana el proyecto educativo con una mirada de comunidad y corresponsabilidad.",
        "Su trabajo fortalece la continuidad del grupo: recursos, eventos, mantenimiento y apoyo en salidas y campamentos.",
      ]}
      bullets={[
        "Gestion de recursos y mejora de infraestructura.",
        "Organizacion de actividades de apoyo y financiamiento.",
        "Acompañamiento activo a la propuesta educativa anual.",
      ]}
    />
  );
};

export default Comite;

